<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$root = dirname(__DIR__);
require_once __DIR__ . '/lib/runtime.php';
load_app_environment($root);

use Firebase\JWT\JWT;

function firebase_v1_fail(string $message, int $exitCode = 1): never
{
    fwrite(STDERR, '[firebase-v1-import] ' . $message . PHP_EOL);
    exit($exitCode);
}

function firebase_v1_options(array $arguments): array
{
    $options = ['commit' => false, 'credential' => null, 'batch' => 'firebase-v1-20260916'];
    foreach ($arguments as $argument) {
        if ($argument === '--commit') {
            $options['commit'] = true;
        } elseif ($argument === '--dry-run') {
            $options['commit'] = false;
        } elseif (str_starts_with($argument, '--credential=')) {
            $options['credential'] = substr($argument, strlen('--credential='));
        } elseif (str_starts_with($argument, '--batch=')) {
            $options['batch'] = substr($argument, strlen('--batch='));
        } elseif ($argument === '--help') {
            echo "Usage: php api/import_firebase_v1.php --credential=/secure/service-account.json [--dry-run|--commit] [--batch=firebase-v1-YYYYMMDD]\n";
            echo "Default mode is --dry-run. --commit writes one atomic, idempotent production batch.\n";
            exit(0);
        } else {
            firebase_v1_fail("Unknown option: $argument", 2);
        }
    }
    if (!is_string($options['credential']) || trim($options['credential']) === '') {
        firebase_v1_fail('--credential is required.', 2);
    }
    if (!preg_match('/^[A-Za-z0-9._:-]{1,100}$/D', (string)$options['batch'])) {
        firebase_v1_fail('--batch must contain 1-100 safe characters.', 2);
    }
    return $options;
}

function firebase_v1_request(string $method, string $url, array $headers, ?string $body = null): array
{
    $handle = curl_init($url);
    $settings = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 45,
    ];
    if ($body !== null) {
        $settings[CURLOPT_POSTFIELDS] = $body;
    }
    curl_setopt_array($handle, $settings);
    $response = curl_exec($handle);
    $status = (int)curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
    $error = curl_error($handle);
    curl_close($handle);
    if ($response === false || $status < 200 || $status >= 300) {
        throw new RuntimeException("Remote request failed with HTTP $status" . ($error !== '' ? ": $error" : '.'));
    }
    $decoded = json_decode($response, true, 512, JSON_THROW_ON_ERROR);
    return is_array($decoded) ? $decoded : [];
}

function firebase_v1_value(array $value): mixed
{
    foreach (['stringValue', 'timestampValue', 'integerValue', 'doubleValue', 'booleanValue', 'nullValue'] as $type) {
        if (array_key_exists($type, $value)) {
            if ($type === 'integerValue') return (int)$value[$type];
            if ($type === 'doubleValue') return (float)$value[$type];
            if ($type === 'nullValue') return null;
            return $value[$type];
        }
    }
    if (isset($value['arrayValue'])) {
        return array_map('firebase_v1_value', $value['arrayValue']['values'] ?? []);
    }
    if (isset($value['mapValue'])) {
        $map = [];
        foreach (($value['mapValue']['fields'] ?? []) as $key => $nested) {
            $map[$key] = firebase_v1_value($nested);
        }
        return $map;
    }
    if (isset($value['referenceValue'])) return (string)$value['referenceValue'];
    if (isset($value['geoPointValue'])) return $value['geoPointValue'];
    return null;
}

function firebase_v1_documents(string $base, string $collection, array $headers): array
{
    $documents = [];
    $pageToken = null;
    do {
        $url = $base . '/' . rawurlencode($collection) . '?pageSize=1000';
        if ($pageToken) $url .= '&pageToken=' . rawurlencode($pageToken);
        $page = firebase_v1_request('GET', $url, $headers);
        foreach (($page['documents'] ?? []) as $source) {
            $fields = [];
            foreach (($source['fields'] ?? []) as $key => $value) {
                $fields[$key] = firebase_v1_value($value);
            }
            $name = (string)($source['name'] ?? '');
            $fields['_id'] = rawurldecode((string)basename($name));
            $fields['_create_time'] = $source['createTime'] ?? null;
            $fields['_update_time'] = $source['updateTime'] ?? null;
            $documents[] = $fields;
        }
        $pageToken = $page['nextPageToken'] ?? null;
    } while ($pageToken);
    return $documents;
}

function firebase_v1_text(mixed $value, int $limit): string
{
    $text = trim((string)$value);
    if ($text === '') return '';
    return mb_substr($text, 0, $limit, 'UTF-8');
}

function firebase_v1_email(mixed $value): string
{
    $email = strtolower(trim((string)$value));
    return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : '';
}

function firebase_v1_timer_seed_key(string $sourceKey): string
{
    // timer_sessions.seed_key is VARCHAR(200), while an auditable Firestore
    // source key can be longer. Keep the full key in the staging table and use
    // a deterministic digest only for the operational row's idempotency key.
    return 'firebase-v1:' . hash('sha256', $sourceKey);
}

function firebase_v1_normalize(string $value): string
{
    $value = mb_strtolower(trim($value), 'UTF-8');
    if (class_exists(Transliterator::class)) {
        $normalized = Transliterator::create('Any-Latin; Latin-ASCII; Lower()');
        if ($normalized) $value = (string)$normalized->transliterate($value);
    }
    $value = strtr($value, [
        'à' => 'a', 'á' => 'a', 'ạ' => 'a', 'ả' => 'a', 'ã' => 'a',
        'â' => 'a', 'ầ' => 'a', 'ấ' => 'a', 'ậ' => 'a', 'ẩ' => 'a', 'ẫ' => 'a',
        'ă' => 'a', 'ằ' => 'a', 'ắ' => 'a', 'ặ' => 'a', 'ẳ' => 'a', 'ẵ' => 'a',
        'è' => 'e', 'é' => 'e', 'ẹ' => 'e', 'ẻ' => 'e', 'ẽ' => 'e',
        'ê' => 'e', 'ề' => 'e', 'ế' => 'e', 'ệ' => 'e', 'ể' => 'e', 'ễ' => 'e',
        'ì' => 'i', 'í' => 'i', 'ị' => 'i', 'ỉ' => 'i', 'ĩ' => 'i',
        'ò' => 'o', 'ó' => 'o', 'ọ' => 'o', 'ỏ' => 'o', 'õ' => 'o',
        'ô' => 'o', 'ồ' => 'o', 'ố' => 'o', 'ộ' => 'o', 'ổ' => 'o', 'ỗ' => 'o',
        'ơ' => 'o', 'ờ' => 'o', 'ớ' => 'o', 'ợ' => 'o', 'ở' => 'o', 'ỡ' => 'o',
        'ù' => 'u', 'ú' => 'u', 'ụ' => 'u', 'ủ' => 'u', 'ũ' => 'u',
        'ư' => 'u', 'ừ' => 'u', 'ứ' => 'u', 'ự' => 'u', 'ử' => 'u', 'ữ' => 'u',
        'ỳ' => 'y', 'ý' => 'y', 'ỵ' => 'y', 'ỷ' => 'y', 'ỹ' => 'y', 'đ' => 'd',
    ]);
    $value = preg_replace('/[^a-z0-9]+/u', ' ', $value) ?? '';
    return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
}

function firebase_v1_datetime(mixed $value): ?DateTimeImmutable
{
    if ($value instanceof DateTimeImmutable) return $value;
    if (is_int($value) || is_float($value) || (is_string($value) && preg_match('/^\d+(?:\.\d+)?$/D', trim($value)))) {
        $number = (float)$value;
        if ($number > 100000000000.0) $number /= 1000.0;
        if ($number > 1000000000.0 && $number < 5000000000.0) {
            return (new DateTimeImmutable('@' . (string)(int)$number))->setTimezone(new DateTimeZone('UTC'));
        }
    }
    $text = trim((string)$value);
    if ($text === '') return null;
    try {
        return new DateTimeImmutable($text);
    } catch (Throwable) {
        return null;
    }
}

function firebase_v1_mode(string $description): string
{
    $normalized = firebase_v1_normalize($description);
    return preg_match('/^hoan thanh lab co huong dan\b/', $normalized) === 1 ? 'guide' : 'practice';
}

function firebase_v1_device_token(string $name): string
{
    $normalized = strtoupper(preg_replace('/[^A-Za-z0-9]+/', '', firebase_v1_normalize($name)) ?? '');
    foreach (['AC1000HI', 'AC1000F', 'AX3000CV2', 'AX3000HV2', 'AX3000GZ', 'AX3000S', 'BE12000Z', 'BE12000', 'BE15000', 'BE6500C', 'VIGOR2927', 'MIKROTIK'] as $token) {
        if (str_contains($normalized, $token)) return $token === 'BE12000Z' ? 'BE12000' : $token;
    }
    return $normalized !== '' ? $normalized : 'UNKNOWN';
}

final class FirebaseV1Catalog
{
    private array $devices = [];
    private array $labs = [];
    private array $labsByDevice = [];
    private array $newDevices = [];
    private array $newLabs = [];

    public function __construct(PDO $pdo)
    {
        foreach ($pdo->query('SELECT device_id, model, device_name FROM device_catalog')->fetchAll() as $row) {
            $this->devices[(string)$row['device_id']] = $row;
        }
        foreach ($pdo->query('SELECT lab_id, device_id, lab_name FROM lab_catalog')->fetchAll() as $row) {
            $id = (string)$row['lab_id'];
            $this->labs[$id] = $row;
            $this->labsByDevice[(string)$row['device_id']][] = $id;
        }
    }

    public function resolve(string $deviceName, string $labName): array
    {
        $deviceId = $this->resolveDevice($deviceName);
        $title = firebase_v1_normalize($labName);
        foreach ($this->labsByDevice[$deviceId] ?? [] as $labId) {
            if (str_starts_with($labId, 'FSV1_LAB_')) continue;
            if (firebase_v1_normalize((string)$this->labs[$labId]['lab_name']) === $title) {
                return [$deviceId, $labId, false];
            }
        }
        $task = preg_replace('/^bai\s*\d+\s*/', '', $title) ?? $title;
        $bestId = null;
        $bestScore = 0.0;
        foreach ($this->labsByDevice[$deviceId] ?? [] as $labId) {
            if (str_starts_with($labId, 'FSV1_LAB_')) continue;
            $candidate = firebase_v1_normalize((string)$this->labs[$labId]['lab_name']);
            $candidate = preg_replace('/^bai\s*\d+\s*/', '', $candidate) ?? $candidate;
            similar_text($task, $candidate, $score);
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestId = $labId;
            }
        }
        if ($bestId !== null && $bestScore >= 96.0) {
            return [$deviceId, $bestId, false];
        }
        foreach ($this->labsByDevice[$deviceId] ?? [] as $labId) {
            if (!str_starts_with($labId, 'FSV1_LAB_')) continue;
            if (firebase_v1_normalize((string)$this->labs[$labId]['lab_name']) === $title) {
                return [$deviceId, $labId, true];
            }
        }
        $labId = 'FSV1_LAB_' . strtoupper(substr(hash('sha256', $deviceId . '|' . $title), 0, 16));
        if (!isset($this->labs[$labId])) {
            $row = ['lab_id' => $labId, 'device_id' => $deviceId, 'lab_name' => firebase_v1_text($labName, 150) ?: 'Bài lab lịch sử'];
            $this->labs[$labId] = $row;
            $this->labsByDevice[$deviceId][] = $labId;
            $this->newLabs[$labId] = $row;
        }
        return [$deviceId, $labId, true];
    }

    public function devices(): array { return $this->devices; }
    public function labs(): array { return $this->labs; }
    public function newDevices(): array { return $this->newDevices; }
    public function newLabs(): array { return $this->newLabs; }

    private function resolveDevice(string $name): string
    {
        $token = firebase_v1_device_token($name);
        foreach ($this->devices as $deviceId => $device) {
            if (firebase_v1_device_token((string)$device['model']) === $token
                || firebase_v1_device_token((string)$device['device_name']) === $token) {
                return $deviceId;
            }
        }
        $deviceId = 'FSV1_DEV_' . strtoupper(substr(hash('sha256', $token), 0, 14));
        if (!isset($this->devices[$deviceId])) {
            $row = [
                'device_id' => $deviceId,
                'model' => firebase_v1_text($token, 100),
                'device_name' => firebase_v1_text($name, 100) ?: 'Thiết bị lịch sử',
            ];
            $this->devices[$deviceId] = $row;
            $this->newDevices[$deviceId] = $row;
        }
        return $deviceId;
    }
}

function firebase_v1_load_source(string $credentialPath): array
{
    if (!is_file($credentialPath)) throw new RuntimeException('Credential file does not exist.');
    $credential = json_decode((string)file_get_contents($credentialPath), true, 512, JSON_THROW_ON_ERROR);
    foreach (['project_id', 'client_email', 'private_key', 'token_uri'] as $field) {
        if (empty($credential[$field])) throw new RuntimeException("Credential is missing $field.");
    }
    $now = time();
    $assertion = JWT::encode([
        'iss' => $credential['client_email'],
        'scope' => 'https://www.googleapis.com/auth/datastore',
        'aud' => $credential['token_uri'],
        'iat' => $now,
        'exp' => $now + 3600,
    ], $credential['private_key'], 'RS256');
    $token = firebase_v1_request('POST', (string)$credential['token_uri'], [
        'Content-Type: application/x-www-form-urlencoded',
    ], http_build_query([
        'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion' => $assertion,
    ]));
    $headers = ['Authorization: Bearer ' . $token['access_token']];
    $projectId = (string)$credential['project_id'];
    $base = 'https://firestore.googleapis.com/v1/projects/' . rawurlencode($projectId) . '/databases/(default)/documents';
    $collections = [];
    foreach (['users', 'classes', 'assignments', 'activity_logs'] as $collection) {
        $collections[$collection] = firebase_v1_documents($base, $collection, $headers);
    }
    return ['project_id' => $projectId, 'collections' => $collections];
}

function firebase_v1_stage(PDO $pdo, string $batch, string $projectHash, array $collections): array
{
    $sourceCounts = array_map('count', $collections);
    $upsertBatch = $pdo->prepare(<<<'SQL'
        INSERT INTO firebase_legacy_import_batches (
            batch_key, source_project_hash, source_counts, status, started_at
        ) VALUES (:batch, :project_hash, CAST(:source_counts AS jsonb), 'staged', NOW())
        ON CONFLICT (batch_key) DO UPDATE SET
            source_counts = EXCLUDED.source_counts,
            source_project_hash = EXCLUDED.source_project_hash,
            status = 'staged',
            completed_at = NULL
        SQL);
    $upsertBatch->execute([
        'batch' => $batch,
        'project_hash' => $projectHash,
        'source_counts' => json_encode($sourceCounts, JSON_UNESCAPED_SLASHES),
    ]);
    $stage = $pdo->prepare(<<<'SQL'
        INSERT INTO firebase_legacy_import_events (
            batch_key, source_collection, source_document_id, source_key,
            source_payload, source_payload_sha256, normalized_email, event_at,
            account_group, resolution_status, resolution_reason
        )
        SELECT :batch, row.collection, row.document_id, row.source_key,
            row.payload, row.payload_hash, row.email, row.event_at,
            'NOT_APPLICABLE', 'staged', NULL
          FROM jsonb_to_recordset(CAST(:rows AS jsonb)) AS row(
              collection text, document_id text, source_key text, payload jsonb,
              payload_hash text, email text, event_at timestamptz
          )
        ON CONFLICT (source_key) DO UPDATE SET
            batch_key = EXCLUDED.batch_key,
            source_payload = EXCLUDED.source_payload,
            source_payload_sha256 = EXCLUDED.source_payload_sha256,
            normalized_email = EXCLUDED.normalized_email,
            event_at = EXCLUDED.event_at,
            staged_at = NOW()
        SQL);
    $manifestParts = [];
    $staged = 0;
    $stageRows = [];
    foreach ($collections as $collection => $documents) {
        foreach ($documents as $document) {
            $documentId = firebase_v1_text($document['_id'] ?? '', 240);
            if ($documentId === '') throw new RuntimeException("$collection contains a document without an id.");
            ksort($document);
            $payload = json_encode($document, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $payloadHash = hash('sha256', $payload);
            $sourceKey = 'firestore:' . substr($projectHash, 0, 16) . ':' . $collection . ':' . $documentId;
            $event = firebase_v1_datetime($document['timestamp'] ?? $document['createdAt'] ?? $document['_create_time'] ?? null);
            $stageRows[] = [
                'collection' => $collection,
                'document_id' => $documentId,
                'source_key' => $sourceKey,
                'payload' => $document,
                'payload_hash' => $payloadHash,
                'email' => firebase_v1_email($document['email'] ?? null) ?: null,
                'event_at' => $event?->format(DateTimeInterface::ATOM),
            ];
            if (count($stageRows) >= 500) {
                $stage->execute([
                    'batch' => $batch,
                    'rows' => json_encode($stageRows, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                ]);
                $stageRows = [];
            }
            $manifestParts[] = $sourceKey . ':' . $payloadHash;
            $staged++;
        }
    }
    if ($stageRows) {
        $stage->execute([
            'batch' => $batch,
            'rows' => json_encode($stageRows, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        ]);
    }
    sort($manifestParts, SORT_STRING);
    return [
        'source_counts' => $sourceCounts,
        'staged_count' => $staged,
        'manifest_sha256' => hash('sha256', implode("\n", $manifestParts)),
    ];
}

function firebase_v1_import_activities(PDO $pdo, string $batch, string $projectHash, array $documents): array
{
    $users = [];
    foreach ($pdo->query(
        "SELECT user_id, LOWER(email) AS email, display_name, role, employee_id,
                region_id, unit_code, dashboard_region, is_terminated
           FROM users WHERE NULLIF(email, '') IS NOT NULL"
    )->fetchAll() as $row) {
        $users[(string)$row['email']] = $row;
    }
    $catalog = new FirebaseV1Catalog($pdo);
    $activities = [];
    $quarantined = 0;
    $groupCounts = ['KTV' => 0, 'FTC_TEST' => 0, 'FTC_UNASSIGNED' => 0];
    foreach ($documents as $document) {
        $documentId = firebase_v1_text($document['_id'] ?? '', 240);
        $sourceKey = 'firestore:' . substr($projectHash, 0, 16) . ':activity_logs:' . $documentId;
        $email = firebase_v1_email($document['email'] ?? null);
        $eventAt = firebase_v1_datetime($document['timestamp'] ?? $document['createdAt'] ?? $document['_create_time'] ?? null);
        $title = firebase_v1_text($document['actionTitle'] ?? $document['title'] ?? '', 150);
        $deviceName = firebase_v1_text($document['device'] ?? $document['deviceName'] ?? '', 100);
        $description = firebase_v1_text($document['description'] ?? $document['desc'] ?? $title, 1000);
        if ($email === '' || !$eventAt || $title === '' || $deviceName === '') {
            $quarantined++;
            $activities[] = [
                'source_key' => $sourceKey,
                'document_id' => $documentId,
                'quarantine' => 'Missing valid email, event timestamp, device or lab title.',
            ];
            continue;
        }
        $user = $users[$email] ?? null;
        $role = strtoupper(trim((string)($user['role'] ?? '')));
        $hasLocation = $user && (
            trim((string)($user['region_id'] ?? '')) !== ''
            || trim((string)($user['unit_code'] ?? '')) !== ''
            || trim((string)($user['dashboard_region'] ?? '')) !== ''
        );
        if ($user && $role === 'KTV' && $hasLocation) {
            $accountGroup = 'KTV';
        } elseif ($user && $role === 'KTV') {
            $accountGroup = 'FTC_UNASSIGNED';
        } elseif ($user || preg_match('/(?:^|[._-])(test|demo|admin|ftc|lab|sample|mock)(?:$|[._-]|\d)/i', explode('@', $email)[0])) {
            $accountGroup = 'FTC_TEST';
        } else {
            $accountGroup = 'FTC_UNASSIGNED';
        }
        $groupCounts[$accountGroup]++;
        [$deviceId, $labId, $historicalLab] = $catalog->resolve($deviceName, $title);
        $mode = firebase_v1_mode($description);
        $durationRaw = $document['durationSeconds'] ?? null;
        $duration = is_numeric($durationRaw) && (int)$durationRaw > 0 ? (int)$durationRaw : null;
        $finished = firebase_v1_datetime($document['endTime'] ?? null) ?? $eventAt;
        $started = firebase_v1_datetime($document['startTime'] ?? null);
        if (!$started) $started = $duration ? $finished->modify('-' . $duration . ' seconds') : $finished;
        if ($finished < $started) $started = $finished;
        $activities[] = [
            'source_key' => $sourceKey,
            'timer_seed_key' => firebase_v1_timer_seed_key($sourceKey),
            'document_id' => $documentId,
            'email' => $email,
            'name' => firebase_v1_text($document['user'] ?? ($user['display_name'] ?? ''), 100),
            'user_id' => $role === 'KTV' ? ($user['user_id'] ?? null) : null,
            'employee_id' => $role === 'KTV' ? firebase_v1_text($user['employee_id'] ?? '', 50) : '',
            'account_group' => $accountGroup,
            'device_id' => $deviceId,
            'lab_id' => $labId,
            'lab_name' => $title,
            'device_name' => $deviceName,
            'historical_lab' => $historicalLab,
            'mode' => $mode,
            'started_at' => $started,
            'finished_at' => $finished,
            'duration_sec' => $duration,
            'description' => $description,
        ];
    }

    $insertDevice = $pdo->prepare(<<<'SQL'
        INSERT INTO device_catalog (device_id, model, device_name, sort_order, is_active, created_at, updated_at)
        VALUES (:device_id, :model, :device_name,
                (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM device_catalog), FALSE, NOW(), NOW())
        ON CONFLICT (device_id) DO NOTHING
        SQL);
    foreach ($catalog->newDevices() as $device) $insertDevice->execute($device);
    $insertLab = $pdo->prepare(<<<'SQL'
        INSERT INTO lab_catalog (lab_id, device_id, lab_name, sort_order, is_active, created_at, updated_at)
        VALUES (:lab_id, :device_id, :lab_name,
                (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM lab_catalog WHERE device_id = :device_id),
                FALSE, NOW(), NOW())
        ON CONFLICT (lab_id) DO NOTHING
        SQL);
    foreach ($catalog->newLabs() as $lab) $insertLab->execute($lab);

    $catalogDevices = $catalog->devices();
    $catalogLabs = $catalog->labs();
    $existingSeeds = [];
    foreach ($pdo->query("SELECT seed_key FROM timer_sessions WHERE seed_key LIKE 'firebase-v1:%'")->fetchAll(PDO::FETCH_COLUMN) as $seedKey) {
        $existingSeeds[(string)$seedKey] = true;
    }
    $attemptMax = [];
    foreach ($pdo->query(<<<'SQL'
        SELECT user_id::text AS user_id, LOWER(email) AS email, technician_id, lab_id, practice_attempt_no
          FROM timer_sessions
         WHERE mode IN ('Thực hành', 'practice')
           AND practice_attempt_no IS NOT NULL
        SQL)->fetchAll() as $attemptRow) {
        $labId = (string)$attemptRow['lab_id'];
        $attemptNo = (int)$attemptRow['practice_attempt_no'];
        foreach ([
            'user:' . (string)($attemptRow['user_id'] ?? ''),
            'email:' . (string)($attemptRow['email'] ?? ''),
            'employee:' . (string)($attemptRow['technician_id'] ?? ''),
        ] as $identityKey) {
            if (str_ends_with($identityKey, ':')) continue;
            $key = $identityKey . '|' . $labId;
            $attemptMax[$key] = max($attemptMax[$key] ?? 0, $attemptNo);
        }
    }
    $insert = $pdo->prepare(<<<'SQL'
        INSERT INTO timer_sessions (
            user_id, technician_id, name, email, started_at, finished_at,
            duration_sec, mode, device, device_id, lab_id, lab_name,
            status, completed_first_try, practice_attempt_no, last_action,
            is_passed, score, grading_details, session_type, submission_id,
            is_mock, seed_batch, seed_key, attempt_sequence_complete, created_at
        )
        SELECT NULLIF(row.user_id, '')::uuid, NULLIF(row.employee_id, ''), row.name, row.email,
               row.started_at, row.finished_at, row.duration_sec, row.mode,
               row.device, row.device_id, row.lab_id, row.lab_name,
               'completed', NULL, row.practice_attempt_no, row.last_action,
               row.is_passed, NULL, NULL, row.session_type, row.submission_id,
               FALSE, :seed_batch, row.seed_key, FALSE, row.created_at
          FROM jsonb_to_recordset(CAST(:rows AS jsonb)) AS row(
              user_id text, employee_id text, name text, email text,
              started_at timestamptz, finished_at timestamptz, duration_sec integer,
              mode text, device text, device_id text, lab_id text, lab_name text,
              practice_attempt_no integer, last_action text, is_passed boolean,
              session_type text, submission_id text, seed_key text, created_at timestamptz
          )
        ON CONFLICT (seed_key) WHERE seed_key IS NOT NULL DO NOTHING
        SQL);
    $updateEvent = $pdo->prepare(<<<'SQL'
        UPDATE firebase_legacy_import_events event
           SET matched_user_id = NULLIF(row.user_id, '')::uuid,
               account_group = row.account_group,
               resolution_status = row.status,
               resolution_reason = row.reason,
               timer_session_id = timer.id,
               imported_at = CASE WHEN row.status = 'imported' THEN NOW() ELSE NULL END
          FROM jsonb_to_recordset(CAST(:rows AS jsonb)) AS row(
              source_key text, timer_seed_key text, user_id text,
              account_group text, status text, reason text
          )
          LEFT JOIN timer_sessions timer ON timer.seed_key = row.timer_seed_key
         WHERE event.source_key = row.source_key
        SQL);
    $imported = 0;
    $skipped = 0;
    $historical = 0;
    usort($activities, static function (array $left, array $right): int {
        $leftTime = isset($left['finished_at']) && $left['finished_at'] instanceof DateTimeImmutable ? $left['finished_at']->getTimestamp() : PHP_INT_MAX;
        $rightTime = isset($right['finished_at']) && $right['finished_at'] instanceof DateTimeImmutable ? $right['finished_at']->getTimestamp() : PHP_INT_MAX;
        return [$leftTime, $left['source_key']] <=> [$rightTime, $right['source_key']];
    });
    $insertRows = [];
    $resolutionRows = [];
    foreach ($activities as $activity) {
        if (isset($activity['quarantine'])) {
            $resolutionRows[] = [
                'user_id' => null, 'account_group' => 'NOT_APPLICABLE',
                'status' => 'quarantined', 'reason' => $activity['quarantine'],
                'timer_seed_key' => null, 'source_key' => $activity['source_key'],
            ];
            continue;
        }
        if (!isset($existingSeeds[$activity['timer_seed_key']])) {
            $attemptNo = null;
            if ($activity['mode'] === 'practice') {
                $identityKeys = array_values(array_filter([
                    $activity['user_id'] ? 'user:' . $activity['user_id'] : null,
                    $activity['email'] ? 'email:' . strtolower($activity['email']) : null,
                    $activity['employee_id'] ? 'employee:' . $activity['employee_id'] : null,
                ]));
                $base = 0;
                foreach ($identityKeys as $identityKey) {
                    $base = max($base, $attemptMax[$identityKey . '|' . $activity['lab_id']] ?? 0);
                }
                $attemptNo = $base + 1;
                foreach ($identityKeys as $identityKey) {
                    $attemptMax[$identityKey . '|' . $activity['lab_id']] = $attemptNo;
                }
            }
            $lab = $catalogLabs[$activity['lab_id']];
            $device = $catalogDevices[$activity['device_id']];
            $submissionId = 'firebase-v1-' . substr(hash('sha256', $activity['source_key']), 0, 40);
            $insertRows[] = [
                'user_id' => $activity['user_id'], 'employee_id' => $activity['employee_id'] ?: null,
                'name' => $activity['name'], 'email' => $activity['email'],
                'started_at' => $activity['started_at']->format(DateTimeInterface::ATOM),
                'finished_at' => $activity['finished_at']->format(DateTimeInterface::ATOM),
                'duration_sec' => $activity['duration_sec'],
                'mode' => $activity['mode'] === 'guide' ? 'Hướng dẫn' : 'Thực hành',
                'device' => $device['device_name'], 'device_id' => $activity['device_id'],
                'lab_id' => $activity['lab_id'], 'lab_name' => $lab['lab_name'],
                'practice_attempt_no' => $attemptNo, 'last_action' => $activity['description'],
                'is_passed' => $activity['mode'] === 'practice' ? 1 : null,
                'session_type' => $activity['mode'], 'submission_id' => $submissionId,
                'seed_key' => $activity['timer_seed_key'],
                'created_at' => $activity['finished_at']->format(DateTimeInterface::ATOM),
            ];
            $existingSeeds[$activity['timer_seed_key']] = true;
            $imported++;
        } else {
            $skipped++;
        }
        if ($activity['historical_lab']) $historical++;
        $resolutionRows[] = [
            'user_id' => $activity['user_id'], 'account_group' => $activity['account_group'],
            'status' => 'imported', 'reason' => $activity['historical_lab'] ? 'Imported with historical inactive catalog mapping.' : null,
            'timer_seed_key' => $activity['timer_seed_key'], 'source_key' => $activity['source_key'],
        ];
    }
    foreach (array_chunk($insertRows, 500) as $rows) {
        $insert->execute([
            'seed_batch' => $batch,
            'rows' => json_encode($rows, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        ]);
    }
    foreach (array_chunk($resolutionRows, 500) as $rows) {
        $updateEvent->execute([
            'rows' => json_encode($rows, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        ]);
    }
    $skipOther = $pdo->prepare(<<<'SQL'
        UPDATE firebase_legacy_import_events
           SET resolution_status = 'skipped',
               resolution_reason = 'Source preserved for audit; no operational row is created for this collection.'
         WHERE batch_key = :batch
           AND source_collection <> 'activity_logs'
        SQL);
    $skipOther->execute(['batch' => $batch]);
    return [
        'imported' => $imported,
        'already_imported' => $skipped,
        'quarantined' => $quarantined,
        'source_only' => $skipOther->rowCount(),
        'historical_catalog_sessions' => $historical,
        'account_groups' => $groupCounts,
        'new_historical_devices' => count($catalog->newDevices()),
        'new_historical_labs' => count($catalog->newLabs()),
    ];
}

if (defined('FIREBASE_V1_LIBRARY_ONLY') && FIREBASE_V1_LIBRARY_ONLY === true) {
    return;
}

$options = firebase_v1_options(array_slice($argv, 1));
$pdo = null;
try {
    $source = firebase_v1_load_source((string)$options['credential']);
    $projectHash = hash('sha256', (string)$source['project_id']);
    $pdo = create_database_connection();
    if (!$pdo->query("SELECT to_regclass('public.firebase_legacy_import_events')")->fetchColumn()) {
        throw new RuntimeException('Migration 044_firebase_v1_history_import must be applied first.');
    }
    if ($options['commit']) {
        $existingBatch = $pdo->prepare('SELECT status FROM firebase_legacy_import_batches WHERE batch_key = :batch');
        $existingBatch->execute(['batch' => $options['batch']]);
        if ($existingBatch->fetchColumn() === 'committed') {
            throw new RuntimeException('This batch is already committed; use a new batch key only for a different source snapshot.');
        }
    }
    $pdo->beginTransaction();
    $lock = $pdo->prepare("SELECT pg_advisory_xact_lock(hashtext(:lock_name))");
    $lock->execute(['lock_name' => 'ftc_firebase_v1_import']);
    $pdo->exec('LOCK TABLE timer_sessions IN SHARE ROW EXCLUSIVE MODE');
    $stage = firebase_v1_stage($pdo, (string)$options['batch'], $projectHash, $source['collections']);
    $result = firebase_v1_import_activities(
        $pdo,
        (string)$options['batch'],
        $projectHash,
        $source['collections']['activity_logs']
    );
    $summary = $stage + $result;
    $finish = $pdo->prepare(<<<'SQL'
        UPDATE firebase_legacy_import_batches
           SET staged_count = :staged,
               imported_count = :imported,
               quarantined_count = :quarantined,
               skipped_count = :skipped,
               manifest_sha256 = :manifest,
               summary = CAST(:summary AS jsonb),
               status = 'committed',
               completed_at = NOW()
         WHERE batch_key = :batch
        SQL);
    $finish->execute([
        'staged' => $stage['staged_count'], 'imported' => $result['imported'],
        'quarantined' => $result['quarantined'], 'skipped' => $result['source_only'] + $result['already_imported'],
        'manifest' => $stage['manifest_sha256'],
        'summary' => json_encode($summary, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        'batch' => $options['batch'],
    ]);
    if ($options['commit']) {
        $pdo->commit();
        $mode = 'committed';
    } else {
        $pdo->rollBack();
        $mode = 'dry-run-rolled-back';
    }
    echo json_encode(['mode' => $mode, 'batch' => $options['batch'], 'summary' => $summary], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), PHP_EOL;
} catch (Throwable $exception) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    firebase_v1_fail($exception->getMessage());
}
