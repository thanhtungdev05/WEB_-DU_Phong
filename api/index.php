<?php
declare(strict_types=1);

use Stevenmaguire\OAuth2\Client\Provider\Keycloak;

$root = dirname(__DIR__);
require_once __DIR__ . '/lib/runtime.php';
require_once __DIR__ . '/lib/PostgresSessionHandler.php';
require_once __DIR__ . '/lib/iam_identity.php';
require_once __DIR__ . '/lib/tracking_handler.php';
require_once __DIR__ . '/lib/ktv_roster_import.php';
require_once __DIR__ . '/lib/training_classes.php';
require_once __DIR__ . '/lib/report_xlsx.php';
require_once __DIR__ . '/lib/dashboard_report.php';
require_once __DIR__ . '/lib/dashboard_report_cache.php';
require_once __DIR__ . '/lib/dashboard_technicians.php';
require_once __DIR__ . '/lib/system_usage.php';
load_app_environment($root);

$GLOBALS['request_id'] = bin2hex(random_bytes(8));
$GLOBALS['request_started_at'] = microtime(true);
$GLOBALS['database_query_count'] = 0;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Request-ID: ' . $GLOBALS['request_id']);
$corsOrigin = app_origin(env_value('APP_BASE_URL', '')) ?? request_origin();
header('Access-Control-Allow-Origin: ' . $corsOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Tracking-Key');
header('Access-Control-Expose-Headers: X-Request-ID, X-Response-Bytes, X-Database-Queries, X-Dashboard-Cache, Server-Timing');
header('Access-Control-Max-Age: 86400');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    respond([], 204);
}
$path = $_SERVER['PATH_INFO'] ?? '';
if ($path === '') {
    $requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '';
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    if ($script && str_starts_with($requestPath, $script)) {
        $path = substr($requestPath, strlen($script));
    }
}
$segments = array_values(array_filter(explode('/', $path), fn($part) => $part !== ''));
$resource = $segments[0] ?? '';

function json_body_with_limit(int $maximumBytes): array
{
    $contentLength = filter_var($_SERVER['CONTENT_LENGTH'] ?? null, FILTER_VALIDATE_INT);
    if ($contentLength !== false && $contentLength > $maximumBytes) {
        fail(413, 'payload-too-large', 'Request body exceeds the allowed size.');
    }

    $stream = fopen('php://input', 'rb');
    $raw = $stream ? stream_get_contents($stream, $maximumBytes + 1) : false;
    if (is_resource($stream)) {
        fclose($stream);
    }
    if (is_string($raw) && strlen($raw) > $maximumBytes) {
        fail(413, 'payload-too-large', 'Request body exceeds the allowed size.');
    }
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    try {
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR | JSON_BIGINT_AS_STRING);
    } catch (JsonException) {
        fail(400, 'bad-request', 'Invalid JSON body.');
    }
    if (!is_array($decoded)) {
        fail(400, 'bad-request', 'JSON body must be an object.');
    }
    return $decoded;
}

function json_body(): array
{
    return json_body_with_limit(env_int('API_MAX_BODY_BYTES', 65536, 1024, 1048576));
}

function report_json_body(): array
{
    return json_body_with_limit(env_int('API_MAX_REPORT_BODY_BYTES', 8388608, 1048576, 16777216));
}

function respond(array $payload = [], int $status = 200): void
{
    http_response_code($status);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        http_response_code(500);
        echo '{"error":{"code":"json-encode-failed","message":"Unable to encode API response."}}';
        exit;
    }

    $responseBytes = strlen($json);
    $queryCount = function_exists('database_query_count') ? database_query_count() : 0;
    $requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '/';
    $isDashboardDataEndpoint = str_contains($requestPath, '/dashboard/');
    $responseBudget = $isDashboardDataEndpoint
        ? env_int('DASHBOARD_MAX_RESPONSE_BYTES', 2097152, 65536, 16777216)
        : env_int('API_MAX_RESPONSE_BYTES', 8388608, 65536, 33554432);
    $queryBudget = $isDashboardDataEndpoint
        ? env_int('DASHBOARD_MAX_QUERY_COUNT', 8, 1, 100)
        : env_int('API_MAX_QUERY_COUNT', 20, 1, 200);
    header('X-Response-Bytes: ' . $responseBytes);
    header('X-Database-Queries: ' . $queryCount);
    error_log(json_encode([
        'level' => ($responseBytes > $responseBudget || $queryCount > $queryBudget) ? 'warning' : 'info',
        'event' => 'api_response',
        'request_id' => $GLOBALS['request_id'] ?? null,
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
        'endpoint' => $requestPath,
        'status' => $status,
        'response_bytes' => $responseBytes,
        'database_queries' => $queryCount,
        'dashboard_cache' => $GLOBALS['dashboard_report_cache_status'] ?? null,
        'response_budget_bytes' => $responseBudget,
        'query_budget' => $queryBudget,
        'budget_exceeded' => $responseBytes > $responseBudget || $queryCount > $queryBudget,
        'duration_ms' => (int)round((microtime(true) - (float)($GLOBALS['request_started_at'] ?? microtime(true))) * 1000),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

    $acceptEncoding = strtolower((string)($_SERVER['HTTP_ACCEPT_ENCODING'] ?? ''));
    if (strlen($json) >= 1024 && str_contains($acceptEncoding, 'gzip') && function_exists('gzencode')) {
        $compressed = gzencode($json, 6);
        if ($compressed !== false) {
            header('Content-Encoding: gzip');
            header('Vary: Accept-Encoding');
            echo $compressed;
            exit;
        }
    }

    echo $json;
    exit;
}

function fail(int $status, string $code, string $message): void
{
    respond([
        'error' => [
            'code' => $code,
            'message' => $message,
            'requestId' => $GLOBALS['request_id'] ?? null,
        ],
    ], $status);
}

function report_exception(Throwable $exception, string $context): void
{
    error_log(json_encode([
        'level' => 'error',
        'context' => $context,
        'request_id' => $GLOBALS['request_id'] ?? null,
        'exception' => get_class($exception),
        'message' => $exception->getMessage(),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    try {
        $pdo = create_database_connection();
    } catch (Throwable $exception) {
        report_exception($exception, 'database-connect');
        fail(500, 'db-connect-error', 'Unable to connect to the database.');
    }

    return $pdo;
}

function is_https_request(): bool
{
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }

    $forwardedProto = strtolower(trim(explode(',', (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''))[0]));
    return $forwardedProto === 'https';
}

function is_local_request(): bool
{
    $hostHeader = (string)($_SERVER['HTTP_HOST'] ?? '');
    $parsedHost = parse_url('http://' . $hostHeader, PHP_URL_HOST);
    $host = strtolower(trim((string)$parsedHost, '[]'));

    return in_array($host, ['localhost', '127.0.0.1', '::1'], true);
}

function dev_bypass_enabled(): bool
{
    if (env_value('APP_ENV', '') === 'production') {
        // HTTP_HOST is controlled by the requester and must never grant
        // administrator access in production.
        return false;
    }
    return is_local_request() || env_bool('AUTH_BYPASS_DEV', false);
}

function request_origin(): string
{
    $scheme = is_https_request() ? 'https' : 'http';
    return $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}

function app_origin(string $url): ?string
{
    $parts = parse_url(trim($url));
    if (!is_array($parts)) {
        return null;
    }
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    if (!in_array($scheme, ['http', 'https'], true)) {
        return null;
    }
    $host = (string)($parts['host'] ?? '');
    if ($host === '' || preg_match('/[\r\n]/', $host)) {
        return null;
    }
    $port = isset($parts['port']) ? ':' . (int)$parts['port'] : '';
    return $scheme . '://' . strtolower($host) . $port;
}

function is_local_origin(?string $origin): bool
{
    if (!$origin) {
        return false;
    }
    $host = parse_url($origin, PHP_URL_HOST);
    return in_array(strtolower((string)$host), ['localhost', '127.0.0.1', '::1'], true);
}

function enforce_write_origin(string $resource, string $method): void
{
    if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        return;
    }

    // External tracking uses a secret header and is authenticated again by the
    // handler. Every cookie-authenticated browser write must be same-origin.
    $hasTrackingCredential = !empty($_SERVER['HTTP_X_TRACKING_KEY'])
        || preg_match('/^Bearer\s+\S+/i', (string)($_SERVER['HTTP_AUTHORIZATION'] ?? '')) === 1;
    if ($resource === 'tracking' && $hasTrackingCredential) {
        return;
    }

    if (dev_bypass_enabled()) {
        return;
    }

    $suppliedOrigin = app_origin((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if (!$suppliedOrigin) {
        $suppliedOrigin = app_origin((string)($_SERVER['HTTP_REFERER'] ?? ''));
    }
    if (is_local_request() && is_local_origin($suppliedOrigin)) {
        return;
    }
    $allowedOrigins = array_values(array_filter([
        app_origin(env_value('APP_BASE_URL', '')),
        is_local_request() ? app_origin(request_origin()) : null,
    ]));
    if (!$suppliedOrigin || !in_array($suppliedOrigin, $allowedOrigins, true)) {
        fail(403, 'security/origin-rejected', 'This write request did not originate from the application.');
    }
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function should_use_secure_session_cookie(): bool
{
    return env_bool('SESSION_COOKIE_SECURE', is_https_request()) && is_https_request();
}

function initialize_session(string $root, bool $readOnly = false): void
{
    $ttlSeconds = env_int('SESSION_TTL_SECONDS', 3600, 300, 86400);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string)$ttlSeconds);
    // Expired rows are cleaned by deploy/maintenance jobs, not random GETs.
    ini_set('session.gc_probability', '0');
    session_name(env_value('SESSION_COOKIE_NAME', 'ftc_session'));

    $driver = strtolower(is_local_request()
        ? env_value('SESSION_DRIVER_LOCAL', 'files')
        : env_value('SESSION_DRIVER', 'files'));
    if ($driver === 'database') {
        session_set_save_handler(new PostgresSessionHandler(fn(): PDO => db(), $ttlSeconds), true);
    } elseif ($driver === 'files') {
        $sessionPath = env_value('SESSION_SAVE_PATH', $root . DIRECTORY_SEPARATOR . 'scratch' . DIRECTORY_SEPARATOR . 'sessions');
        if (!is_dir((string)$sessionPath) && !@mkdir((string)$sessionPath, 0777, true) && !is_dir((string)$sessionPath)) {
            $sessionPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'ftc_sessions';
            if (!is_dir((string)$sessionPath) && !@mkdir((string)$sessionPath, 0777, true) && !is_dir((string)$sessionPath)) {
                $sessionPath = sys_get_temp_dir();
            }
        }
        if (!is_writable((string)$sessionPath)) {
            $sessionPath = sys_get_temp_dir();
        }
        session_save_path((string)$sessionPath);
    } else {
        fail(500, 'session-config-error', 'Unsupported session driver.');
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => should_use_secure_session_cookie(),
    ]);
    session_start($readOnly ? ['read_and_close' => true] : []);
}

function is_root_iam_callback(string $resource, string $method): bool
{
    return $resource === ''
        && $method === 'GET'
        && (isset($_GET['code']) || isset($_GET['error']) || isset($_GET['state']));
}

enforce_write_origin($resource, $method);

$requiresSession = api_resource_requires_session($resource) || $resource === 'dev' || is_root_iam_callback($resource, $method);

if ($requiresSession) {
    try {
        $readOnlySession = $method === 'GET'
            && !is_root_iam_callback($resource, $method)
            && !in_array($resource, ['dev', 'iam', 'auth'], true);
        initialize_session($root, $readOnlySession);
    } catch (Throwable $exception) {
        report_exception($exception, 'session-start');
        fail(500, 'session-error', 'Unable to initialize the application session.');
    }
}

function mock_bypass_user(): array
{
    return [
        'user_id' => '00000000-0000-0000-0000-000000000001',
        'email' => 'dev-bypass@ftc.local',
        'role' => 'DEV',
        'role_name' => 'Nhà phát triển',
        'is_admin' => true,
        'can_export_reports' => true,
        'display_name' => 'KTV DEV (Bypass Mode)',
        'iam_subject' => 'dev-bypass-admin',
        'last_login_at' => (new DateTimeImmutable())->format(DateTimeInterface::ATOM),
        'created_at' => (new DateTimeImmutable())->format(DateTimeInterface::ATOM),
        'updated_at' => (new DateTimeImmutable())->format(DateTimeInterface::ATOM),
    ];
}

function normalize_role_code(mixed $role): ?string
{
    if (!is_scalar($role)) {
        return null;
    }
    $code = strtoupper(trim((string)$role));
    if ($code === 'USER') {
        $code = 'KTV';
    }
    return in_array($code, ['KTV', 'ADMIN', 'DEV'], true) ? $code : null;
}

function role_definition(mixed $role): array
{
    static $definitions = [];
    $code = normalize_role_code($role) ?? 'KTV';
    if (isset($definitions[$code])) {
        return $definitions[$code];
    }

    $stmt = db()->prepare(
        'SELECT role_code, role_name, is_admin, can_export_reports, sort_order
           FROM roles
          WHERE role_code = :role_code'
    );
    $stmt->execute(['role_code' => $code]);
    $row = $stmt->fetch();
    if (!$row) {
        fail(500, 'role-config-missing', 'Role configuration is missing.');
    }
    $definitions[$code] = [
        'role_code' => $code,
        'role_name' => (string)$row['role_name'],
        'is_admin' => database_boolean($row['is_admin']),
        'can_export_reports' => database_boolean($row['can_export_reports']),
        'sort_order' => (int)$row['sort_order'],
    ];
    return $definitions[$code];
}

function user_role_definition(array $user): array
{
    if (array_key_exists('is_admin', $user) && array_key_exists('can_export_reports', $user)) {
        return [
            'role_code' => normalize_role_code($user['role'] ?? null) ?? 'KTV',
            'role_name' => (string)($user['role_name'] ?? ($user['role'] ?? 'KTV')),
            'is_admin' => database_boolean($user['is_admin']),
            'can_export_reports' => database_boolean($user['can_export_reports']),
            'sort_order' => (int)($user['sort_order'] ?? 0),
        ];
    }
    return role_definition($user['role'] ?? null);
}

function role_is_admin(array $user): bool
{
    return user_role_definition($user)['is_admin'];
}

function role_can_export_reports(array $user): bool
{
    return user_role_definition($user)['can_export_reports'];
}

function is_dev_bypass_session(): bool
{
    return dev_bypass_enabled() && (($_SESSION['iam_subject'] ?? null) === 'dev-bypass-admin');
}

function current_email(): ?string
{
    return $_SESSION['user_email'] ?? null;
}

function current_user_id(): ?string
{
    return $_SESSION['user_id'] ?? null;
}

function require_user(): array
{
    if (is_dev_bypass_session()) {
        return mock_bypass_user();
    }

    $userId = current_user_id();
    $email = current_email();
    if (!$userId && !$email) {
        if (dev_bypass_enabled()) {
            return mock_bypass_user();
        }
        fail(401, 'auth/unauthenticated', 'You must sign in first.');
    }

    $user = $userId ? find_user_by_id($userId, true) : find_user((string)$email, true);
    if (!$user) {
        if (dev_bypass_enabled()) {
            return mock_bypass_user();
        }
        unset($_SESSION['user_id'], $_SESSION['user_email'], $_SESSION['iam_subject']);
        fail(401, 'auth/unauthenticated', 'Session user no longer exists.');
    }
    if (database_boolean($user['is_terminated'] ?? false)) {
        unset($_SESSION['user_id'], $_SESSION['user_email'], $_SESSION['iam_subject']);
        fail(403, 'auth/account-inactive', 'This employee account is no longer active.');
    }
    return $user;
}

function require_admin(): array
{
    if (is_dev_bypass_session()) {
        return mock_bypass_user();
    }

    $user = require_user();
    if (!role_is_admin($user)) {
        if (dev_bypass_enabled()) {
            return mock_bypass_user();
        }
        fail(403, 'permission-denied', 'Admin permission is required.');
    }
    return $user;
}

function require_report_export(?array $user = null): array
{
    $user = $user ?? require_admin();
    if (!role_is_admin($user)) {
        fail(403, 'permission-denied', 'Admin permission is required.');
    }
    if (!role_can_export_reports($user)) {
        fail(403, 'report-export-forbidden', 'Only the DEV role can export reports.');
    }
    return $user;
}

function normalize_email(string $email): string
{
    return strtolower(trim($email));
}

function database_boolean(mixed $value): bool
{
    if (is_bool($value)) {
        return $value;
    }
    if (is_int($value)) {
        return $value === 1;
    }
    return in_array(strtolower(trim((string)$value)), ['1', 't', 'true', 'yes', 'y', 'on'], true);
}

function database_nullable_boolean(mixed $value): ?bool
{
    return $value === null ? null : database_boolean($value);
}

function safe_datetime(?string $value): ?string
{
    if (!$value) {
        return null;
    }
    try {
        return (new DateTimeImmutable($value))->format(DateTimeInterface::ATOM);
    } catch (Throwable $e) {
        return null;
    }
}

const USER_COLUMNS = 'user_id, email, display_name, role, last_login_at, iam_profile,
    employee_id, job_title, training_start_date, training_end_date, class_code,
    is_terminated, termination_date, termination_reason, unit_id, unit_code, unit_name,
    region_code, dashboard_region, region_id, employee_source,
    employee_seed_batch, employee_synced_at, created_at, updated_at';
const AUTH_USER_COLUMNS = 'user_id, email, display_name, role, last_login_at,
    employee_id, job_title, training_start_date, training_end_date, class_code,
    is_terminated, termination_date, termination_reason, unit_id, unit_code, unit_name,
    region_code, dashboard_region, region_id, created_at, updated_at';
const LOGIN_LOG_COLUMNS = 'id, created_at, event_type, user_id, employee_id, display_name, email, role, iam_subject, ip_address, user_agent, session_id_hash';

function find_user(string $email, bool $authorizationOnly = false): ?array
{
    $columns = $authorizationOnly ? AUTH_USER_COLUMNS : USER_COLUMNS;
    $stmt = db()->prepare('SELECT ' . $columns . ' FROM users WHERE email = :email');
    $stmt->execute(['email' => normalize_email($email)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function find_user_by_id(string $userId, bool $authorizationOnly = false): ?array
{
    $columns = $authorizationOnly ? AUTH_USER_COLUMNS : USER_COLUMNS;
    $stmt = db()->prepare('SELECT ' . $columns . ' FROM users WHERE user_id = :user_id');
    $stmt->execute(['user_id' => $userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function find_user_by_employee_id(string $employeeId): ?array
{
    $stmt = db()->prepare('SELECT ' . USER_COLUMNS . ' FROM users WHERE employee_id = :employee_id');
    $stmt->execute(['employee_id' => trim($employeeId)]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function user_response(?array $row): ?array
{
    if (!$row) {
        return null;
    }
    $role = user_role_definition($row);
    return [
        'id' => $row['user_id'],
        'userId' => $row['user_id'],
        'user_id' => $row['user_id'],
        'email' => $row['email'],
        'role' => $role['role_code'],
        'roleName' => $role['role_name'],
        'role_name' => $role['role_name'],
        'isAdmin' => $role['is_admin'],
        'is_admin' => $role['is_admin'],
        'canExportReports' => $role['can_export_reports'],
        'can_export_reports' => $role['can_export_reports'],
        'permissions' => [
            'admin' => $role['is_admin'],
            'exportReports' => $role['can_export_reports'],
            'export_reports' => $role['can_export_reports'],
        ],
        'displayName' => $row['display_name'] ?? null,
        'display_name' => $row['display_name'] ?? null,
        'employeeId' => $row['employee_id'] ?? null,
        'employee_id' => $row['employee_id'] ?? null,
        'jobTitle' => $row['job_title'] ?? null,
        'job_title' => $row['job_title'] ?? null,
        'trainingStartDate' => $row['training_start_date'] ?? null,
        'training_start_date' => $row['training_start_date'] ?? null,
        'trainingEndDate' => $row['training_end_date'] ?? null,
        'training_end_date' => $row['training_end_date'] ?? null,
        'classCode' => $row['class_code'] ?? null,
        'class_code' => $row['class_code'] ?? null,
        'className' => $row['class_name'] ?? null,
        'class_name' => $row['class_name'] ?? null,
        'sourceClassCode' => $row['source_class_code'] ?? ($row['class_code'] ?? null),
        'source_class_code' => $row['source_class_code'] ?? ($row['class_code'] ?? null),
        'isTerminated' => database_boolean($row['is_terminated'] ?? false),
        'is_terminated' => database_boolean($row['is_terminated'] ?? false),
        'terminationDate' => $row['termination_date'] ?? null,
        'termination_date' => $row['termination_date'] ?? null,
        'terminationReason' => $row['termination_reason'] ?? null,
        'termination_reason' => $row['termination_reason'] ?? null,
        'unitCode' => $row['unit_code'] ?? null,
        'unit_code' => $row['unit_code'] ?? null,
        'unitName' => $row['unit_name'] ?? null,
        'unit_name' => $row['unit_name'] ?? null,
        'unitId' => $row['unit_id'] ?? null,
        'unit_id' => $row['unit_id'] ?? null,
        'regionCode' => $row['region_code'] ?? null,
        'region_code' => $row['region_code'] ?? null,
        'regionName' => $row['region_name'] ?? ($row['dashboard_region'] ?? null),
        'region_name' => $row['region_name'] ?? ($row['dashboard_region'] ?? null),
        'branchName' => $row['branch_name'] ?? null,
        'branch_name' => $row['branch_name'] ?? null,
        'dashboardRegion' => $row['dashboard_region'] ?? null,
        'dashboard_region' => $row['dashboard_region'] ?? null,
        'regionId' => $row['region_id'] ?? null,
        'region_id' => $row['region_id'] ?? null,
        'locationAssigned' => database_boolean($row['location_assigned'] ?? !empty($row['region_id'])),
        'location_assigned' => database_boolean($row['location_assigned'] ?? !empty($row['region_id'])),
        'lastLoginAt' => $row['last_login_at'] ?? null,
        'last_login_at' => $row['last_login_at'] ?? null,
        'createdAt' => $row['created_at'] ?? null,
        'updatedAt' => $row['updated_at'] ?? null,
    ];
}

function login_log_response(array $row): array
{
    return [
        'id' => (string)$row['id'],
        'userId' => $row['user_id'] ?? null,
        'user_id' => $row['user_id'] ?? null,
        'eventType' => $row['event_type'] ?? 'iam_callback_success',
        'event_type' => $row['event_type'] ?? 'iam_callback_success',
        'email' => $row['email'] ?? null,
        'employeeId' => $row['employee_id'] ?? null,
        'employee_id' => $row['employee_id'] ?? null,
        'displayName' => $row['display_name'] ?? null,
        'display_name' => $row['display_name'] ?? null,
        'iamSubject' => $row['iam_subject'] ?? null,
        'iam_subject' => $row['iam_subject'] ?? null,
        'role' => $row['role'] ?? null,
        'ipAddress' => $row['ip_address'] ?? null,
        'ip_address' => $row['ip_address'] ?? null,
        'userAgent' => $row['user_agent'] ?? null,
        'user_agent' => $row['user_agent'] ?? null,
        'sessionIdHash' => $row['session_id_hash'] ?? null,
        'session_id_hash' => $row['session_id_hash'] ?? null,
        'createdAt' => $row['created_at'] ?? null,
        'timestamp' => $row['created_at'] ?? null,
    ];
}

function app_url(string $path): string
{
    $base = rtrim(env_value('APP_BASE_URL', ''), '/');
    if (!$base) {
        $scheme = is_https_request() ? 'https' : 'http';
        $base = $scheme . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    }
    return $base . $path;
}

function redirect_to(string $url): void
{
    header('Location: ' . $url, true, 302);
    exit;
}

function iam_provider(): Keycloak
{
    if (!class_exists(Keycloak::class)) {
        fail(500, 'iam/package-missing', 'IAM package is missing. Run composer install.');
    }

    $authServerUrl = rtrim(env_value('IAM_AUTH_SERVER_URL', ''), '/');
    $realm = env_value('IAM_REALM');
    $clientId = env_value('IAM_CLIENT_ID');
    $clientSecret = env_value('IAM_CLIENT_SECRET');
    $redirectUri = env_value('IAM_REDIRECT_URI', app_url('/'));

    if (!$authServerUrl || !$realm || !$clientId || !$clientSecret || !$redirectUri) {
        fail(500, 'iam-config-error', 'IAM config is missing. Set IAM_AUTH_SERVER_URL, IAM_REALM, IAM_CLIENT_ID, IAM_CLIENT_SECRET and IAM_REDIRECT_URI.');
    }

    return new Keycloak([
        'authServerUrl' => $authServerUrl,
        'realm' => $realm,
        'clientId' => $clientId,
        'clientSecret' => $clientSecret,
        'redirectUri' => $redirectUri,
        'timeout' => (float)env_value('IAM_HTTP_TIMEOUT', '15'),
    ]);
}

function iam_identity(array $profile): array
{
    try {
        return iam_identity_from_profile(
            $profile,
            env_value('IAM_FALLBACK_EMAIL_DOMAIN', 'iam.local')
        );
    } catch (InvalidArgumentException $exception) {
        report_exception($exception, 'iam-profile-validation');
        fail(400, 'iam/invalid-profile', 'IAM profile is missing required identity claims.');
    }
}

function upsert_iam_user(array $profile): array
{
    $identity = iam_identity($profile);
    if ($identity['employee_id'] !== null && strlen($identity['employee_id']) > 20) {
        fail(400, 'iam/invalid-profile', 'IAM employee_id exceeds the supported length.');
    }

    $emailUser = find_user($identity['email']);
    $employeeUser = $identity['employee_id']
        ? find_user_by_employee_id($identity['employee_id'])
        : null;
    if ($emailUser && $employeeUser && $emailUser['user_id'] !== $employeeUser['user_id']) {
        fail(409, 'iam/identity-conflict', 'IAM email and employee_id belong to different users.');
    }
    if (
        $emailUser
        && $identity['employee_id'] !== null
        && !empty($emailUser['employee_id'])
        && $emailUser['employee_id'] !== $identity['employee_id']
    ) {
        fail(409, 'iam/identity-conflict', 'IAM employee_id does not match the employee assigned to this email.');
    }
    $existing = $emailUser ?: $employeeUser;
    $profileJson = json_encode($profile, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($profileJson === false) {
        $profileJson = '{}';
    }

    if ($existing) {
        $role = normalize_role_code($existing['role'] ?? null) ?? 'KTV';

        $stmt = db()->prepare(
            'UPDATE users
             SET email = :email,
                 role = :role,
                 display_name = CASE
                     WHEN employee_source IS NOT NULL THEN COALESCE(display_name, :roster_display_name)
                     ELSE COALESCE(:iam_display_name, display_name)
                 END,
                 employee_id = COALESCE(employee_id, :employee_id),
                 iam_profile = :iam_profile,
                 last_login_at = NOW(),
                 updated_at = NOW()
             WHERE user_id = :user_id
             RETURNING ' . USER_COLUMNS
        );
        $stmt->execute([
            'user_id' => $existing['user_id'],
            'email' => $identity['email'],
            'role' => $role,
            'roster_display_name' => $identity['display_name'],
            'iam_display_name' => $identity['display_name'],
            'employee_id' => $identity['employee_id'],
            'iam_profile' => $profileJson,
        ]);
        return $stmt->fetch() ?: $existing;
    }

    $stmt = db()->prepare(
        'INSERT INTO users
         (email, role, display_name, employee_id, iam_profile, last_login_at, created_at, updated_at)
         VALUES
         (:email, :role, :display_name, :employee_id, :iam_profile, NOW(), NOW(), NOW())
         RETURNING ' . USER_COLUMNS
    );
    $stmt->execute([
        'email' => $identity['email'],
        'role' => 'KTV',
        'display_name' => $identity['display_name'],
        'employee_id' => $identity['employee_id'],
        'iam_profile' => $profileJson,
    ]);
    $newUser = $stmt->fetch();
    if (!$newUser) {
        fail(500, 'iam/upsert-failed', 'Failed to create user from IAM profile.');
    }
    return $newUser;
}

function iam_post_login_url(array $user): string
{
    return app_url('/portal.html');
}

function request_ip(): ?string
{
    $dispatcherClient = trim((string)($_SERVER['HTTP_X_FTC_CLIENT_IP'] ?? ''));
    if ($dispatcherClient !== '' && filter_var($dispatcherClient, FILTER_VALIDATE_IP)) {
        return $dispatcherClient;
    }
    if (is_local_request() || env_bool('TRUST_X_FORWARDED_FOR', false)) {
        $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($forwarded) {
            $first = trim(explode(',', $forwarded)[0]);
            if ($first !== '') {
                return $first;
            }
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? null;
}

function request_user_agent(): ?string
{
    $agent = trim((string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
    return $agent !== '' ? $agent : null;
}

function session_id_hash(): ?string
{
    $id = session_id();
    return $id !== '' ? hash('sha256', $id) : null;
}

function record_login_log(array $user, string $eventType = 'iam_callback_success'): void
{
    $stmt = db()->prepare(
        'INSERT INTO login_logs
         (event_type, user_id, email, employee_id, display_name, iam_subject, role, ip_address, user_agent, session_id_hash, created_at)
         VALUES
         (:event_type, :user_id, :email, :employee_id, :display_name, :iam_subject, :role, :ip_address, :user_agent, :session_id_hash, NOW())'
    );
    $stmt->execute([
        'event_type' => $eventType,
        'user_id' => $user['user_id'] ?? null,
        'email' => $user['email'] ?? null,
        'employee_id' => $user['employee_id'] ?? null,
        'display_name' => $user['display_name'] ?? null,
        'iam_subject' => $user['iam_subject'] ?? null,
        'role' => normalize_role_code($user['role'] ?? null) ?? 'KTV',
        'ip_address' => request_ip(),
        'user_agent' => request_user_agent(),
        'session_id_hash' => session_id_hash(),
    ]);
}

function handle_auth(array $segments, string $method): void
{
    $action = $segments[1] ?? '';

    if ($action === 'session' && $method === 'GET') {
        $user = null;
        if (is_dev_bypass_session()) {
            $user = mock_bypass_user();
        } elseif (current_user_id()) {
            $user = find_user_by_id((string)current_user_id(), true);
        } elseif (current_email()) {
            $user = find_user((string)current_email(), true);
        }
        if ($user && database_boolean($user['is_terminated'] ?? false)) {
            unset($_SESSION['user_id'], $_SESSION['user_email'], $_SESSION['iam_subject']);
            $user = null;
        }
        if (!$user && dev_bypass_enabled()) {
            $user = mock_bypass_user();
        }
        respond(['user' => user_response($user)]);
    }

    if ($action === 'logout' && $method === 'POST') {
        $user = null;
        if (is_dev_bypass_session()) {
            $user = null;
        } elseif (current_user_id()) {
            $user = find_user_by_id((string)current_user_id());
        } elseif (current_email()) {
            $user = find_user((string)current_email());
        }
        if ($user) {
            record_login_log($user, 'logout');
        }
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();
        respond(['ok' => true]);
    }

    if (in_array($action, ['register', 'login', 'send-verification', 'verify', 'password-reset', 'reset-password'], true)) {
        fail(410, 'auth/iam-only', 'Password registration/login is disabled. Use IAM/Azure login.');
    }

    fail(404, 'not-found', 'Auth endpoint not found.');
}

function handle_iam(array $segments, string $method): void
{
    $action = $segments[1] ?? '';

    if ($action === 'login' && $method === 'GET') {
        $provider = iam_provider();
        $scope = preg_split('/\s+/', trim(env_value('IAM_SCOPE', 'openid profile email'))) ?: ['openid', 'profile', 'email'];
        $authOptions = ['scope' => $scope];
        if (is_local_request() && (string)($_GET['local'] ?? '') === '1') {
            $authOptions['state'] = 'ftc-local-dev.' . base64url_encode(request_origin()) . '.' . bin2hex(random_bytes(16));
        }
        $authUrl = $provider->getAuthorizationUrl($authOptions);
        $_SESSION['oauth2state'] = $provider->getState();
        redirect_to($authUrl);
    }

    if ($action === 'callback' && $method === 'GET') {
        process_iam_callback();
    }

    fail(404, 'not-found', 'IAM endpoint not found.');
}

function process_iam_callback(): void
{
    if (!empty($_GET['error'])) {
        $message = (string)($_GET['error_description'] ?? $_GET['error']);
        fail(401, 'iam/login-failed', $message);
    }

    $state = (string)($_GET['state'] ?? '');
    if ($state === '' || empty($_SESSION['oauth2state']) || $state !== $_SESSION['oauth2state']) {
        unset($_SESSION['oauth2state']);
        fail(400, 'iam/invalid-state', 'Invalid IAM state. Please start login again.');
    }
    unset($_SESSION['oauth2state']);

    $code = (string)($_GET['code'] ?? '');
    if ($code === '') {
        fail(400, 'iam/missing-code', 'IAM callback is missing authorization code.');
    }

    $provider = iam_provider();
    $token = $provider->getAccessToken('authorization_code', ['code' => $code]);
    $owner = $provider->getResourceOwner($token);
    $profile = $owner->toArray();
    $user = upsert_iam_user($profile);
    if (database_boolean($user['is_terminated'] ?? false)) {
        unset($_SESSION['user_id'], $_SESSION['user_email'], $_SESSION['iam_subject']);
        fail(403, 'auth/account-inactive', 'This employee account is no longer active.');
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['user_email'] = $user['email'];
    record_login_log($user);
    redirect_to(iam_post_login_url($user));
}

function query_limit(int $default = 100, int $maximum = 500): int
{
    $value = filter_var($_GET['limit'] ?? null, FILTER_VALIDATE_INT);
    if ($value === false || $value === null) {
        return $default;
    }
    return max(1, min($maximum, (int)$value));
}

function encode_cursor(array $payload): string
{
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
    return rtrim(strtr(base64_encode((string)$json), '+/', '-_'), '=');
}

function decode_cursor(?string $cursor): array
{
    if (!$cursor) {
        return [];
    }
    if (strlen($cursor) > 2048) {
        fail(400, 'bad-cursor', 'The pagination cursor is invalid.');
    }

    $normalized = strtr($cursor, '-_', '+/');
    $padding = strlen($normalized) % 4;
    if ($padding > 0) {
        $normalized .= str_repeat('=', 4 - $padding);
    }
    $decoded = base64_decode($normalized, true);
    $payload = $decoded === false ? null : json_decode($decoded, true);
    if (!is_array($payload)) {
        fail(400, 'bad-cursor', 'The pagination cursor is invalid.');
    }
    return $payload;
}

function normalized_timestamp(mixed $value, string $label): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_scalar($value)) {
        fail(400, 'bad-filter', "The $label timestamp is invalid.");
    }

    $text = trim((string)$value);
    if ($text === '') {
        return null;
    }
    try {
        return (new DateTimeImmutable($text))->format(DateTimeInterface::ATOM);
    } catch (Throwable) {
        fail(400, 'bad-filter', "The $label timestamp is invalid.");
    }
}

function query_timestamp(string $name): ?string
{
    return normalized_timestamp($_GET[$name] ?? null, $name);
}

function pagination_response(array $items, int $limit, bool $hasMore, ?string $nextCursor): array
{
    return [
        'items' => $items,
        'pagination' => [
            'limit' => $limit,
            'hasMore' => $hasMore,
            'nextCursor' => $nextCursor,
        ],
    ];
}

function optional_text(array $input, string $key, int $maximumLength = 500): ?string
{
    if (!array_key_exists($key, $input) || $input[$key] === null) {
        return null;
    }
    if (!is_scalar($input[$key])) {
        fail(400, 'bad-request', "$key must be text.");
    }
    $value = trim((string)$input[$key]);
    $length = function_exists('mb_strlen') ? mb_strlen($value) : strlen($value);
    if ($length > $maximumLength) {
        fail(400, 'bad-request', "$key exceeds the maximum length.");
    }
    return $value === '' ? null : $value;
}

function handle_users(array $segments, string $method): void
{
    $current = require_user();
    $email = isset($segments[1]) ? normalize_email(rawurldecode($segments[1])) : null;

    if (!$email && $method === 'GET') {
        require_admin();
        $limit = query_limit();
        $cursor = decode_cursor(isset($_GET['cursor']) ? (string)$_GET['cursor'] : null);
        $where = [];
        $params = [];

        $search = trim((string)($_GET['q'] ?? ''));
        if ($search !== '') {
            $where[] = '(email ILIKE :search_email
                OR display_name ILIKE :search_name
                OR employee_id ILIKE :search_employee
                OR class_code ILIKE :search_class)';
            $searchPattern = '%' . $search . '%';
            $params['search_email'] = $searchPattern;
            $params['search_name'] = $searchPattern;
            $params['search_employee'] = $searchPattern;
            $params['search_class'] = $searchPattern;
        }

        $role = trim((string)($_GET['role'] ?? ''));
        if ($role !== '') {
            $role = normalize_role_code($role);
            if ($role === null) {
                fail(400, 'bad-filter', 'Invalid role filter.');
            }
            $where[] = 'role = :role';
            $params['role'] = $role;
        }

        if (array_key_exists('created_at', $cursor) || array_key_exists('email', $cursor)) {
            $cursorCreatedAt = normalized_timestamp($cursor['created_at'] ?? null, 'cursor created_at');
            $cursorEmail = is_scalar($cursor['email'] ?? null)
                ? normalize_email((string)$cursor['email'])
                : '';
            if (!$cursorCreatedAt || !filter_var($cursorEmail, FILTER_VALIDATE_EMAIL) || strlen($cursorEmail) > 320) {
                fail(400, 'bad-cursor', 'The users cursor is invalid.');
            }
            $where[] = '(created_at < :cursor_created_at OR (created_at = :cursor_created_at AND email < :cursor_email))';
            $params['cursor_created_at'] = $cursorCreatedAt;
            $params['cursor_email'] = $cursorEmail;
        }

        $sql = 'SELECT ' . USER_COLUMNS . ' FROM users';
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY created_at DESC, email DESC LIMIT ' . ($limit + 1);
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $hasMore = count($rows) > $limit;
        if ($hasMore) {
            $rows = array_slice($rows, 0, $limit);
        }
        $last = $rows ? $rows[array_key_last($rows)] : null;
        $nextCursor = $hasMore && $last ? encode_cursor(['created_at' => $last['created_at'], 'email' => $last['email']]) : null;
        respond(pagination_response(array_map('user_response', $rows), $limit, $hasMore, $nextCursor));
    }

    if ($email && $method === 'GET') {
        if (!role_is_admin($current) && $current['email'] !== $email) {
            fail(403, 'permission-denied', 'You can only read your own user profile.');
        }
        $user = find_user($email);
        if (!$user) {
            fail(404, 'not-found', 'User not found.');
        }
        respond(['item' => user_response($user)]);
    }

    if ($email && in_array($method, ['PUT', 'PATCH'], true)) {
        $actor = require_admin();
        $input = json_body();
        $newRole = normalize_role_code($input['role'] ?? null);
        if ($newRole === null) {
            fail(400, 'bad-request', 'Role must be KTV, ADMIN, or DEV.');
        }
        $newRoleDefinition = role_definition($newRole);

        $pdo = db();
        $pdo->beginTransaction();
        try {
            $adminIds = $pdo
                ->query(
                    'SELECT u.user_id
                       FROM users u
                       JOIN roles r ON r.role_code = u.role
                      WHERE r.is_admin = TRUE
                      ORDER BY u.user_id
                      FOR UPDATE OF u'
                )
                ->fetchAll(PDO::FETCH_COLUMN);
            if (!in_array($actor['user_id'], $adminIds, true)) {
                $pdo->rollBack();
                fail(403, 'permission-denied', 'Admin permission is required.');
            }

            $targetStatement = $pdo->prepare('SELECT ' . USER_COLUMNS . ' FROM users WHERE email = :email FOR UPDATE');
            $targetStatement->execute(['email' => $email]);
            $target = $targetStatement->fetch();
            if (!$target) {
                $pdo->rollBack();
                fail(404, 'not-found', 'User not found.');
            }
            if ($newRole === $target['role']) {
                $pdo->commit();
                respond(['item' => user_response($target)]);
            }
            if (role_is_admin($target) && !$newRoleDefinition['is_admin'] && count($adminIds) <= 1) {
                $pdo->rollBack();
                fail(409, 'last-admin', 'The last administrator cannot be demoted.');
            }

            $stmt = $pdo->prepare('UPDATE users SET role = :role, updated_at = NOW() WHERE user_id = :user_id RETURNING ' . USER_COLUMNS);
            $stmt->execute(['user_id' => $target['user_id'], 'role' => $newRole]);
            $updated = $stmt->fetch();
            if (!$updated) {
                $pdo->rollBack();
                fail(500, 'save-failed', 'User update returned no data.');
            }

            $pdo->commit();
            respond(['item' => user_response($updated)]);
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }
    }

    fail(404, 'not-found', 'Users endpoint not found.');
}

function role_response(array $row): array
{
    return [
        'code' => (string)$row['role_code'],
        'roleCode' => (string)$row['role_code'],
        'role_code' => (string)$row['role_code'],
        'name' => (string)$row['role_name'],
        'roleName' => (string)$row['role_name'],
        'role_name' => (string)$row['role_name'],
        'isAdmin' => database_boolean($row['is_admin']),
        'is_admin' => database_boolean($row['is_admin']),
        'canExportReports' => database_boolean($row['can_export_reports']),
        'can_export_reports' => database_boolean($row['can_export_reports']),
        'sortOrder' => (int)$row['sort_order'],
        'sort_order' => (int)$row['sort_order'],
    ];
}

function handle_roles(array $segments, string $method): void
{
    require_admin();
    if (($segments[1] ?? '') !== '' || $method !== 'GET') {
        fail(404, 'not-found', 'Roles endpoint not found.');
    }
    $rows = db()->query(
        'SELECT role_code, role_name, is_admin, can_export_reports, sort_order
           FROM roles
          ORDER BY sort_order, role_code'
    )->fetchAll();
    respond(['items' => array_map('role_response', $rows)]);
}

function handle_login_logs(array $segments, string $method): void
{
    if ($method === 'GET') {
        require_admin();
        $limit = query_limit();
        $cursor = decode_cursor(isset($_GET['cursor']) ? (string)$_GET['cursor'] : null);
        $where = [];
        $params = [];

        if (isset($cursor['id'])) {
            $cursorId = filter_var($cursor['id'], FILTER_VALIDATE_INT);
            if ($cursorId === false) {
                fail(400, 'bad-cursor', 'The login cursor is invalid.');
            }
            $where[] = 'id < :cursor_id';
            $params['cursor_id'] = $cursorId;
        }
        $from = query_timestamp('from');
        $to = query_timestamp('to');
        if ($from) {
            $where[] = 'created_at >= :from_time';
            $params['from_time'] = $from;
        }
        if ($to) {
            $where[] = 'created_at <= :to_time';
            $params['to_time'] = $to;
        }
        foreach (['email' => 'email', 'employee_id' => 'employee_id', 'event_type' => 'event_type'] as $queryKey => $column) {
            $value = trim((string)($_GET[$queryKey] ?? ''));
            if ($value !== '') {
                $where[] = $column . ' = :' . $queryKey;
                $params[$queryKey] = $value;
            }
        }

        $sql = 'SELECT ' . LOGIN_LOG_COLUMNS . ' FROM login_logs';
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY id DESC LIMIT ' . ($limit + 1);
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $hasMore = count($rows) > $limit;
        if ($hasMore) {
            $rows = array_slice($rows, 0, $limit);
        }
        $last = $rows ? $rows[array_key_last($rows)] : null;
        $nextCursor = $hasMore && $last ? encode_cursor(['id' => (int)$last['id']]) : null;
        respond(pagination_response(array_map('login_log_response', $rows), $limit, $hasMore, $nextCursor));
    }

    fail(404, 'not-found', 'Login logs endpoint not found.');
}

function handle_health(string $method): void
{
    if ($method !== 'GET') {
        fail(405, 'method-not-allowed', 'Health endpoint only supports GET.');
    }

    $pdo = db();
    $pdo->query('SELECT 1');
    $migrationTable = $pdo->query("SELECT to_regclass('public.schema_migrations')")->fetchColumn();
    $latestMigration = null;
    if ($migrationTable) {
        $latestMigration = $pdo->query('SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1')->fetchColumn() ?: null;
    }

    $migrationFiles = glob(__DIR__ . '/migrations/*.sql') ?: [];
    sort($migrationFiles, SORT_STRING);
    $expectedMigration = $migrationFiles
        ? basename($migrationFiles[array_key_last($migrationFiles)], '.sql')
        : null;
    $schemaReady = $expectedMigration !== null && $latestMigration === $expectedMigration;

    $version = env_value('RENDER_GIT_COMMIT', env_value('APP_VERSION', 'development'));
    respond([
        'ok' => $schemaReady,
        'service' => 'postgres-api',
        'version' => $version ? substr($version, 0, 12) : 'development',
        'latestMigration' => $latestMigration,
        'expectedMigration' => $expectedMigration,
        'schemaReady' => $schemaReady,
    ], $schemaReady ? 200 : 503);
}

function handle_dev(array $segments, string $method): void
{
    $action = $segments[1] ?? '';
    if ($action === 'bypass' && $method === 'GET') {
        if (!dev_bypass_enabled()) {
            fail(404, 'not-found', 'Dev endpoint not available.');
        }

        $user = mock_bypass_user();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['iam_subject'] = $user['iam_subject'] ?? null;

        if ((string)($_GET['format'] ?? '') === 'json') {
            respond([
                'ok' => true,
                'bypass' => true,
                'user' => user_response($user),
            ]);
        }

        $next = (string)($_GET['next'] ?? '/portal.html');
        $isLocalAbsolute = (bool)preg_match('#^https?://(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/.*$#i', $next);
        if ($next === '' || (!$isLocalAbsolute && (!str_starts_with($next, '/') || str_starts_with($next, '//')))) {
            $next = '/portal.html';
        }
        redirect_to($next);
    }
    if ($action === 'bypass' && $method === 'POST') {
        if (!dev_bypass_enabled()) {
            fail(404, 'not-found', 'Dev endpoint not available.');
        }

        $user = mock_bypass_user();
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['iam_subject'] = $user['iam_subject'] ?? null;

        respond([
            'ok' => true,
            'bypass' => true,
            'user' => user_response($user),
        ]);
    }
    fail(404, 'not-found', 'Dev endpoint not found.');
}

function roster_batch_id(): string
{
    $timezone = new DateTimeZone(normalize_app_timezone(env_value('APP_TIMEZONE')));
    return 'ktv-roster-' . (new DateTimeImmutable('now', $timezone))->format('Ymd-His') . '-' . bin2hex(random_bytes(4));
}

function roster_uploaded_file(): array
{
    $file = $_FILES['file'] ?? $_FILES['workbook'] ?? null;
    if (!is_array($file)) {
        fail(400, 'bad-request', 'Missing roster import file.');
    }
    $error = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error !== UPLOAD_ERR_OK) {
        $message = match ($error) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Uploaded file is too large.',
            UPLOAD_ERR_PARTIAL => 'Uploaded file was only partially uploaded.',
            UPLOAD_ERR_NO_FILE => 'Missing roster import file.',
            default => 'Unable to receive uploaded file.',
        };
        fail(400, 'upload-error', $message);
    }
    $maximumBytes = env_int('ROSTER_IMPORT_MAX_BYTES', 5 * 1024 * 1024, 1024, 20 * 1024 * 1024);
    if ((int)($file['size'] ?? 0) > $maximumBytes) {
        fail(413, 'payload-too-large', 'Roster import file exceeds the allowed size.');
    }
    $name = (string)($file['name'] ?? '');
    if (!preg_match('/\.xlsx$/i', $name)) {
        fail(400, 'bad-request', 'Roster import file must be an .xlsx workbook.');
    }
    $path = (string)($file['tmp_name'] ?? '');
    if ($path === '' || !is_uploaded_file($path)) {
        fail(400, 'upload-error', 'Uploaded roster file is not available.');
    }
    return [
        'path' => $path,
        'name' => $name,
        'size' => (int)($file['size'] ?? 0),
    ];
}

function roster_parse_bool_query(string $key): bool
{
    $value = $_GET[$key] ?? $_POST[$key] ?? null;
    if ($value === null) {
        return false;
    }
    return in_array(strtolower(trim((string)$value)), ['1', 'true', 'yes', 'y', 'on'], true);
}

function roster_item_response(array $row): array
{
    $sourceClassCode = $row['class_code'] ?? null;
    if (!empty($row['assigned_class_code'])) {
        $row['source_class_code'] = $sourceClassCode;
        $row['class_code'] = $row['assigned_class_code'];
        $row['class_name'] = $row['assigned_class_name'] ?? $row['assigned_class_code'];
    }
    $item = user_response($row) ?? [];
    $item['employeeSource'] = $row['employee_source'] ?? null;
    $item['employee_source'] = $row['employee_source'] ?? null;
    $item['employeeSeedBatch'] = $row['employee_seed_batch'] ?? null;
    $item['employee_seed_batch'] = $row['employee_seed_batch'] ?? null;
    $item['employeeSyncedAt'] = $row['employee_synced_at'] ?? null;
    $item['employee_synced_at'] = $row['employee_synced_at'] ?? null;
    $item['sourceRegionCode'] = $row['source_region_code'] ?? null;
    $item['source_region_code'] = $row['source_region_code'] ?? null;
    $item['sourceDashboardRegion'] = $row['source_dashboard_region'] ?? null;
    $item['source_dashboard_region'] = $row['source_dashboard_region'] ?? null;
    return $item;
}

function roster_assigned_class_join_sql(): string
{
    return <<<'SQL'
LEFT JOIN (
    SELECT enrollment.user_id,
           STRING_AGG(DISTINCT training.class_code, ', ' ORDER BY training.class_code) AS assigned_class_code,
           STRING_AGG(DISTINCT training.class_name, ', ' ORDER BY training.class_name) AS assigned_class_name
      FROM class_enrollments enrollment
      JOIN training_classes training ON training.class_id = enrollment.class_id
     WHERE enrollment.status = 'active'
        AND enrollment.is_mock = FALSE
        AND (enrollment.valid_to IS NULL OR enrollment.valid_to >= CURRENT_DATE)
        AND training.status IN ('planned', 'active')
        AND training.is_mock = FALSE
     GROUP BY enrollment.user_id
 ) assigned_class ON assigned_class.user_id = ktv.user_id
SQL;
}

function roster_assigned_class_lateral_join_sql(): string
{
    return <<<'SQL'
LEFT JOIN LATERAL (
    SELECT STRING_AGG(DISTINCT training.class_code, ', ' ORDER BY training.class_code) AS assigned_class_code,
           STRING_AGG(DISTINCT training.class_name, ', ' ORDER BY training.class_name) AS assigned_class_name
      FROM class_enrollments enrollment
      JOIN training_classes training ON training.class_id = enrollment.class_id
     WHERE enrollment.user_id = ktv.user_id
       AND enrollment.status = 'active'
       AND enrollment.is_mock = FALSE
       AND (enrollment.valid_to IS NULL OR enrollment.valid_to >= CURRENT_DATE)
       AND training.status IN ('planned', 'active')
       AND training.is_mock = FALSE
) assigned_class ON TRUE
SQL;
}

function roster_base_where(array &$params, bool $includeFilters = true, ?array $filters = null): array
{
    $where = [];

    if (!$includeFilters) {
        return $where;
    }

    $filterSource = $filters ?? $_GET;
    $normalizeFilterValues = static function (mixed $rawValue, string $filterName): ?array {
        if ($rawValue === null || $rawValue === '' || $rawValue === 'all') {
            return null;
        }
        $rawValues = is_array($rawValue) ? $rawValue : [$rawValue];
        if (count($rawValues) > 500) {
            fail(400, 'bad-filter', "Too many values for roster $filterName filter.");
        }
        $values = [];
        foreach ($rawValues as $value) {
            if (!is_scalar($value) && $value !== null) {
                fail(400, 'bad-filter', "Invalid roster $filterName filter.");
            }
            $value = trim((string)$value);
            if ($value === '__FTC_NONE_SELECTED__') {
                return [];
            }
            if (mb_strlen($value, 'UTF-8') > 200) {
                fail(400, 'bad-filter', "Roster $filterName filter is too long.");
            }
            if ($value !== '' && $value !== 'all') {
                $values[$value] = true;
            }
        }
        return $values ? array_keys($values) : null;
    };

    $statuses = $normalizeFilterValues($filterSource['status'] ?? 'active', 'status');
    if ($statuses === []) {
        $where[] = 'FALSE';
    } elseif ($statuses !== null) {
        $statuses = array_map('strtolower', $statuses);
        foreach ($statuses as $status) {
            if (!in_array($status, ['active', 'terminated'], true)) {
                fail(400, 'bad-filter', 'Invalid roster status filter.');
            }
        }
        if (count(array_unique($statuses)) === 1) {
            $where[] = $statuses[0] === 'terminated'
                ? 'ktv.is_terminated = TRUE'
                : 'ktv.is_terminated = FALSE';
        }
    }

    $exactFilters = [
        'employeeId' => [
            'column' => "COALESCE(NULLIF(BTRIM(ktv.employee_id), ''), 'Chưa cập nhật')",
            'parameter' => 'filter_employee_id',
        ],
        'name' => [
            'column' => "COALESCE(NULLIF(BTRIM(ktv.display_name), ''), 'Chưa cập nhật')",
            'parameter' => 'filter_name',
        ],
        'email' => [
            'column' => "COALESCE(NULLIF(BTRIM(ktv.email), ''), 'Chưa cập nhật')",
            'parameter' => 'filter_email',
        ],
        'jobTitle' => [
            'column' => "COALESCE(NULLIF(BTRIM(ktv.job_title), ''), 'Chưa cập nhật')",
            'parameter' => 'filter_job_title',
        ],
        'region' => [
            'column' => "COALESCE(NULLIF(BTRIM(ktv.region_name), ''), 'FTC')",
            'parameter' => 'filter_region',
        ],
        'branch' => [
            'column' => "COALESCE(NULLIF(BTRIM(ktv.branch_name), ''), 'Chưa có chi nhánh')",
            'parameter' => 'filter_branch',
        ],
        'className' => [
            'column' => "COALESCE(NULLIF(BTRIM(assigned_class.assigned_class_name), ''), 'Chưa xếp lớp')",
            'parameter' => 'filter_class_name',
        ],
    ];
    foreach ($exactFilters as $queryKey => $definition) {
        $values = $normalizeFilterValues($filterSource[$queryKey] ?? '', $queryKey);
        if ($values === []) {
            $where[] = 'FALSE';
        } elseif ($values !== null) {
            $placeholders = [];
            foreach ($values as $index => $value) {
                $parameter = $definition['parameter'] . '_' . $index;
                $placeholders[] = ':' . $parameter;
                $params[$parameter] = $value;
            }
            $where[] = $definition['column'] . ' IN (' . implode(', ', $placeholders) . ')';
        }
    }

    $searchValue = $filterSource['search'] ?? '';
    if (!is_scalar($searchValue) && $searchValue !== null) {
        fail(400, 'bad-filter', 'Invalid roster search filter.');
    }
    $search = trim((string)$searchValue);
    if (mb_strlen($search, 'UTF-8') > 200) {
        fail(400, 'bad-filter', 'Roster search filter is too long.');
    }
    if ($search !== '') {
        $searchPattern = '%' . $search . '%';
        $where[] = '(
            ktv.employee_id ILIKE :search_eid
            OR ktv.email ILIKE :search_email
            OR ktv.display_name ILIKE :search_name
            OR COALESCE(assigned_class.assigned_class_code, ktv.class_code) ILIKE :search_class
            OR assigned_class.assigned_class_name ILIKE :search_class_name
            OR ktv.unit_code ILIKE :search_unit
            OR ktv.unit_name ILIKE :search_unitname
            OR ktv.region_name ILIKE :search_region
            OR ktv.branch_name ILIKE :search_branch
        )';
        $params['search_eid'] = $searchPattern;
        $params['search_email'] = $searchPattern;
        $params['search_name'] = $searchPattern;
        $params['search_class'] = $searchPattern;
        $params['search_class_name'] = $searchPattern;
        $params['search_unit'] = $searchPattern;
        $params['search_unitname'] = $searchPattern;
        $params['search_region'] = $searchPattern;
        $params['search_branch'] = $searchPattern;
    }

    return $where;
}

function roster_stats(PDO $pdo): array
{
    $params = [];
    $where = roster_base_where($params, false);
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $summary = $pdo
        ->prepare(
            "SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE is_terminated = FALSE) AS active,
                COUNT(*) FILTER (WHERE is_terminated = TRUE) AS terminated
               FROM v_ktv_directory ktv
              $whereSql"
        );
    $summary->execute($params);
    $summary = $summary->fetch() ?: ['total' => 0, 'active' => 0, 'terminated' => 0];

    $regionStmt = $pdo
        ->prepare(
            "SELECT COALESCE(NULLIF(ktv.region_name, ''), 'FTC') AS region,
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE is_terminated = FALSE) AS active,
                    COUNT(*) FILTER (WHERE is_terminated = TRUE) AS terminated
               FROM v_ktv_directory ktv
              $whereSql
              GROUP BY COALESCE(NULLIF(ktv.region_name, ''), 'FTC')
              ORDER BY region"
        );
    $regionStmt->execute($params);
    $regionRows = $regionStmt->fetchAll();

    return [
        'total' => (int)($summary['total'] ?? 0),
        'active' => (int)($summary['active'] ?? 0),
        'terminated' => (int)($summary['terminated'] ?? 0),
        'byRegion' => array_map(static fn(array $row): array => [
            'region' => (string)$row['region'],
            'total' => (int)$row['total'],
            'active' => (int)$row['active'],
            'terminated' => (int)$row['terminated'],
        ], $regionRows),
        'by_region' => array_map(static fn(array $row): array => [
            'region' => (string)$row['region'],
            'total' => (int)$row['total'],
            'active' => (int)$row['active'],
            'terminated' => (int)$row['terminated'],
        ], $regionRows),
    ];
}

function roster_filter_facets(PDO $pdo): array
{
    $classJoinSql = roster_assigned_class_join_sql();
    $stmt = $pdo->query(
        "WITH roster_values AS (
            SELECT ktv.employee_id,
                   ktv.display_name,
                   ktv.email,
                   ktv.job_title,
                   ktv.region_name,
                   ktv.branch_name,
                   assigned_class.assigned_class_name
              FROM v_ktv_directory ktv
              $classJoinSql
        )
        SELECT filter_key, filter_value
          FROM (
                SELECT 'employeeIds'::text AS filter_key,
                       COALESCE(NULLIF(BTRIM(employee_id), ''), 'Chưa cập nhật') AS filter_value
                  FROM roster_values
                UNION ALL
                SELECT 'names', COALESCE(NULLIF(BTRIM(display_name), ''), 'Chưa cập nhật')
                  FROM roster_values
                UNION ALL
                SELECT 'emails', COALESCE(NULLIF(BTRIM(email), ''), 'Chưa cập nhật')
                  FROM roster_values
                UNION ALL
                SELECT 'jobTitles',
                       COALESCE(NULLIF(BTRIM(job_title), ''), 'Chưa cập nhật') AS filter_value
                  FROM roster_values
                UNION ALL
                SELECT 'regions', COALESCE(NULLIF(BTRIM(region_name), ''), 'FTC')
                  FROM roster_values
                UNION ALL
                SELECT 'branches', COALESCE(NULLIF(BTRIM(branch_name), ''), 'Chưa có chi nhánh')
                  FROM roster_values
                UNION ALL
                SELECT 'classes', COALESCE(NULLIF(BTRIM(assigned_class_name), ''), 'Chưa xếp lớp')
                  FROM roster_values
          ) facet_values
         GROUP BY filter_key, filter_value
         ORDER BY filter_key, filter_value"
    );

    $facets = [
        'employeeIds' => [],
        'names' => [],
        'emails' => [],
        'jobTitles' => [],
        'regions' => [],
        'branches' => [],
        'classes' => [],
    ];
    foreach ($stmt->fetchAll() as $row) {
        $key = (string)($row['filter_key'] ?? '');
        $value = trim((string)($row['filter_value'] ?? ''));
        if ($value !== '' && array_key_exists($key, $facets)) {
            $facets[$key][] = $value;
        }
    }
    return $facets;
}

function handle_roster_import(array $actor): void
{
    $file = roster_uploaded_file();
    $dryRun = roster_parse_bool_query('dry_run') || roster_parse_bool_query('dryRun');
    $batch = trim((string)($_POST['batch_id'] ?? $_POST['batchId'] ?? $_GET['batch_id'] ?? ''));
    if ($batch === '') {
        $batch = roster_batch_id();
    }
    if (!preg_match('/^[A-Za-z0-9._:-]{1,100}$/', $batch)) {
        fail(400, 'bad-request', 'Invalid roster batch id.');
    }

    try {
        $parsed = parse_ktv_roster_xlsx($file['path']);
    } catch (Throwable $exception) {
        fail(400, 'bad-workbook', $exception->getMessage());
    }

    $pdo = db();
    $parseErrors = $parsed['errors'] ?? [];
    $parsedRows = $parsed['rows'] ?? [];
    $terminationRows = $parsed['termination_rows'] ?? [];
    $importMode = ($parsed['import_mode'] ?? 'snapshot') === 'delta' ? 'delta' : 'snapshot';
    $terminateMissing = $importMode === 'snapshot';
    $validRowCount = count($parsedRows) + count($terminationRows);
    if ($dryRun) {
        $preview = sync_ktv_roster(
            $pdo,
            $parsedRows,
            $batch,
            true,
            $terminationRows,
            $terminateMissing
        );
        $preview['errors'] = array_merge($parseErrors, $preview['errors'] ?? []);
        $preview['error_count'] = count($preview['errors']);
        $preview['errorCount'] = count($preview['errors']);
        $preview['canImport'] = $preview['error_count'] === 0 && $validRowCount > 0;
        $preview['can_import'] = $preview['canImport'];
        $preview['headers'] = $parsed['headers'] ?? [];
        $preview['terminationHeaders'] = $parsed['termination_headers'] ?? [];
        $preview['termination_headers'] = $parsed['termination_headers'] ?? [];
        $preview['sheetNames'] = $parsed['sheet_names'] ?? [];
        $preview['sheet_names'] = $parsed['sheet_names'] ?? [];
        $preview['fileName'] = $file['name'];
        $preview['file_name'] = $file['name'];
        respond(['data' => $preview]);
    }

    if ($parseErrors) {
        respond([
            'error' => [
                'code' => 'bad-workbook',
                'message' => 'Roster workbook contains invalid rows.',
                'requestId' => $GLOBALS['request_id'] ?? null,
                'details' => $parseErrors,
            ],
        ], 400);
    }

    if ($validRowCount === 0) {
        fail(400, 'empty-roster', 'Roster workbook does not contain any valid employee rows.');
    }

    $preflight = sync_ktv_roster(
        $pdo,
        $parsedRows,
        $batch,
        true,
        $terminationRows,
        $terminateMissing
    );
    if (($preflight['error_count'] ?? 0) > 0) {
        respond([
            'error' => [
                'code' => 'roster-conflict',
                'message' => 'Roster import has conflicts. Please review preview errors before importing.',
                'requestId' => $GLOBALS['request_id'] ?? null,
                'details' => $preflight['errors'],
            ],
        ], 409);
    }
    if (($preflight['terminated'] ?? 0) > 0 && !roster_parse_bool_query('confirm_termination')) {
        $message = $terminateMissing
            ? 'This import will mark employees missing from the snapshot as terminated. Preview and explicitly confirm this change.'
            : 'This import will mark employees listed in the Nghỉ việc sheet as terminated. Preview and explicitly confirm this change.';
        respond([
            'error' => [
                'code' => 'termination-confirmation-required',
                'message' => $message,
                'requestId' => $GLOBALS['request_id'] ?? null,
                'details' => $preflight['changes']['terminated'] ?? [],
            ],
        ], 409);
    }

    $pdo->beginTransaction();
    try {
        $result = sync_ktv_roster(
            $pdo,
            $parsedRows,
            $batch,
            false,
            $terminationRows,
            $terminateMissing
        );
        if (($result['error_count'] ?? 0) > 0) {
            $pdo->rollBack();
            respond([
                'error' => [
                    'code' => 'roster-conflict',
                    'message' => 'Roster import encountered conflicts and was rolled back.',
                    'requestId' => $GLOBALS['request_id'] ?? null,
                    'details' => $result['errors'],
                ],
            ], 409);
        }
        $importedBy = ktv_roster_existing_imported_by($pdo, $actor['user_id'] ?? null);
        ktv_roster_log_import($pdo, $result, $importedBy, $file['name']);
        $pdo->commit();
        respond(['data' => $result]);
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $exception;
    }
}

function handle_roster_list(): void
{
    $pdo = db();
    $limit = query_limit(50, 500);
    $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
    $page = $page === false || $page === null ? 1 : max(1, (int)$page);
    $offset = ($page - 1) * $limit;

    $params = [];
    $where = roster_base_where($params, true);
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
    $classJoinSql = roster_assigned_class_join_sql();

    $filterHasValue = static function (mixed $value): bool {
        if (is_array($value)) {
            return count(array_filter($value, static fn(mixed $item): bool => trim((string)$item) !== '')) > 0;
        }
        return trim((string)$value) !== '';
    };
    $countNeedsClassJoin = $filterHasValue($_GET['className'] ?? null)
        || $filterHasValue($_GET['search'] ?? null);
    $countClassJoinSql = $countNeedsClassJoin ? $classJoinSql : '';
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM v_ktv_directory ktv $countClassJoinSql $whereSql");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $sortValue = $_GET['sort'] ?? '';
    $directionValue = $_GET['direction'] ?? 'asc';
    if ((!is_scalar($sortValue) && $sortValue !== null)
        || (!is_scalar($directionValue) && $directionValue !== null)) {
        fail(400, 'bad-sort', 'Invalid roster sort parameters.');
    }
    $sortKey = trim((string)$sortValue);
    $sortDirection = strtolower(trim((string)$directionValue));
    $sortColumns = [
        'employeeId' => 'ktv.employee_id',
        'name' => 'ktv.display_name',
        'email' => 'ktv.email',
        'jobTitle' => 'ktv.job_title',
        'region' => 'ktv.region_name',
        'branch' => 'ktv.branch_name',
        'className' => 'COALESCE(assigned_class.assigned_class_name, assigned_class.assigned_class_code, ktv.class_code)',
    ];
    if ($sortKey !== '' && !isset($sortColumns[$sortKey])) {
        fail(400, 'bad-sort', 'Unsupported roster sort column.');
    }
    if (!in_array($sortDirection, ['asc', 'desc'], true)) {
        fail(400, 'bad-sort', 'Unsupported roster sort direction.');
    }
    $sortSql = $sortKey !== ''
        ? $sortColumns[$sortKey] . ' ' . strtoupper($sortDirection) . ' NULLS LAST, ktv.display_name NULLS LAST, ktv.email, ktv.user_id'
        : 'ktv.is_terminated ASC, ktv.region_name NULLS LAST, ktv.branch_name NULLS LAST, ktv.display_name NULLS LAST, ktv.email, ktv.user_id';

    $dataNeedsClassBeforeLimit = $countNeedsClassJoin || $sortKey === 'className';
    if ($dataNeedsClassBeforeLimit) {
        $sql = "SELECT ktv.*, assigned_class.assigned_class_code, assigned_class.assigned_class_name
                  FROM v_ktv_directory ktv
                  $classJoinSql
                 $whereSql
                 ORDER BY $sortSql
                 LIMIT :limit OFFSET :offset";
    } else {
        $pageClassJoinSql = roster_assigned_class_lateral_join_sql();
        $sql = "WITH roster_page AS (
                    SELECT ktv.*
                      FROM v_ktv_directory ktv
                     $whereSql
                     ORDER BY $sortSql
                     LIMIT :limit OFFSET :offset
                )
                SELECT ktv.*, assigned_class.assigned_class_code, assigned_class.assigned_class_name
                  FROM roster_page ktv
                  $pageClassJoinSql
                 ORDER BY $sortSql";
    }
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue(':' . $key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $response = [
        'items' => array_map('roster_item_response', $rows),
        'total' => $total,
        'page' => $page,
        'limit' => $limit,
    ];
    $includeMeta = !array_key_exists('include_meta', $_GET) || roster_parse_bool_query('include_meta');
    if ($includeMeta) {
        $response['stats'] = roster_stats($pdo);
        $response['facets'] = roster_filter_facets($pdo);
    }
    respond(['data' => $response]);
}

function handle_roster_meta(): void
{
    $pdo = db();
    respond(['data' => [
        'stats' => roster_stats($pdo),
        'facets' => roster_filter_facets($pdo),
    ]]);
}

function handle_roster_regions(): void
{
    $stmt = db()->query(
        'SELECT region.region_id, region.region_code, region.region_name,
                region.dashboard_group,
                unit.unit_id, unit.unit_code, unit.unit_name
           FROM org_units unit
           JOIN regions region ON region.region_id = unit.region_id
          WHERE unit.is_active = TRUE
            AND region.is_active = TRUE
          ORDER BY region.region_name, unit.unit_name, unit.unit_code'
    );
    $items = array_map(static fn(array $row): array => [
        'regionId' => $row['region_id'],
        'region_id' => $row['region_id'],
        'regionCode' => $row['region_code'],
        'region_code' => $row['region_code'],
        'regionName' => $row['region_name'],
        'region_name' => $row['region_name'],
        'branchName' => $row['unit_name'],
        'branch_name' => $row['unit_name'],
        'unitId' => $row['unit_id'],
        'unit_id' => $row['unit_id'],
        'unitCode' => $row['unit_code'],
        'unit_code' => $row['unit_code'],
        'unitName' => $row['unit_name'],
        'unit_name' => $row['unit_name'],
        'dashboardGroup' => $row['dashboard_group'] ?? null,
        'dashboard_group' => $row['dashboard_group'] ?? null,
    ], $stmt->fetchAll());

    respond_private_cache(
        ['data' => ['items' => $items]],
        env_int('ROSTER_REGION_CACHE_SECONDS', 3600, 300, 86400)
    );
}

function handle_roster_history(): void
{
    $limit = query_limit(50, 200);
    $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
    $page = $page === false || $page === null ? 1 : max(1, (int)$page);
    $offset = ($page - 1) * $limit;
    $pdo = db();

    try {
        $countStmt = $pdo->query('SELECT COUNT(*) FROM roster_import_log');
        $total = (int)$countStmt->fetchColumn();

        $stmt = $pdo->prepare(
            'SELECT log.*, users.email AS imported_by_email, users.display_name AS imported_by_name
               FROM roster_import_log log
               LEFT JOIN users ON users.user_id = log.imported_by
              ORDER BY log.imported_at DESC
              LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = array_map(static function (array $row): array {
            $errors = json_decode((string)($row['error_details'] ?? '[]'), true);
            return [
                'id' => (int)$row['id'],
                'batchId' => $row['batch_id'],
                'batch_id' => $row['batch_id'],
                'fileName' => $row['file_name'],
                'file_name' => $row['file_name'],
                'importedBy' => $row['imported_by'],
                'imported_by' => $row['imported_by'],
                'importedByName' => $row['imported_by_name'],
                'importedByEmail' => $row['imported_by_email'],
                'totalRows' => (int)$row['total_rows'],
                'total_rows' => (int)$row['total_rows'],
                'inserted' => (int)$row['inserted'],
                'updated' => (int)$row['updated'],
                'terminated' => (int)$row['terminated'],
                'reactivated' => (int)$row['reactivated'],
                'errorCount' => (int)$row['error_count'],
                'error_count' => (int)$row['error_count'],
                'errors' => is_array($errors) ? $errors : [],
                'importedAt' => $row['imported_at'],
                'imported_at' => $row['imported_at'],
            ];
        }, $stmt->fetchAll());
    } catch (Throwable $e) {
        report_exception($e, 'roster-history');
        $items = [];
        $total = 0;
    }
    respond(['data' => ['items' => $items, 'total' => $total, 'page' => $page, 'limit' => $limit]]);
}

function roster_optional_date_input(array $input, string $key): ?string
{
    if (!array_key_exists($key, $input) || $input[$key] === null || trim((string)$input[$key]) === '') {
        return null;
    }
    $value = trim((string)$input[$key]);
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value, new DateTimeZone('UTC'));
    $errors = DateTimeImmutable::getLastErrors();
    $valid = $errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0);
    if (!$date || !$valid || $date->format('Y-m-d') !== $value) {
        fail(400, 'bad-request', "$key must be a YYYY-MM-DD date.");
    }
    return $value;
}

function handle_roster_update(string $employeeId): void
{
    if (!preg_match('/^\d{8}$/', $employeeId)) {
        fail(400, 'bad-request', 'Invalid employee id.');
    }
    $input = json_body();
    $pdo = db();

    $stmt = $pdo->prepare('SELECT * FROM users WHERE employee_id = :employee_id FOR UPDATE');
    $pdo->beginTransaction();
    try {
        $stmt->execute(['employee_id' => $employeeId]);
        $existing = $stmt->fetch();
        if (!$existing) {
            $pdo->rollBack();
            fail(404, 'not-found', 'KTV not found.');
        }

        $email = array_key_exists('email', $input) ? normalize_email((string)$input['email']) : (string)$existing['email'];
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $pdo->rollBack();
            fail(400, 'bad-request', 'Invalid email.');
        }
        if ($email !== (string)$existing['email']) {
            $emailCheck = $pdo->prepare('SELECT user_id FROM users WHERE LOWER(email) = LOWER(:email) AND user_id != :uid');
            $emailCheck->execute(['email' => $email, 'uid' => $existing['user_id']]);
            if ($emailCheck->fetch()) {
                $pdo->rollBack();
                fail(409, 'duplicate-email', 'Email is already in use by another user.');
            }
        }
        $displayName = optional_text($input, 'displayName', 200)
            ?? optional_text($input, 'display_name', 200)
            ?? (string)$existing['display_name'];
        if (trim($displayName) === '') {
            $pdo->rollBack();
            fail(400, 'bad-request', 'Display name is required.');
        }

        $locationSupplied = array_key_exists('unitId', $input)
            || array_key_exists('unit_id', $input)
            || array_key_exists('unitCode', $input)
            || array_key_exists('unit_code', $input)
            || array_key_exists('regionId', $input)
            || array_key_exists('region_id', $input);
        $unitId = $existing['unit_id'] ?? null;
        $unitCode = $existing['unit_code'] ?? null;
        $unitName = $existing['unit_name'] ?? null;
        $regionId = $existing['region_id'] ?? null;
        $regionCode = $existing['region_code'] ?? null;
        $dashboardRegion = $existing['dashboard_region'] ?? null;
        if ($locationSupplied) {
            $requestedUnitId = optional_text($input, 'unitId', 36)
                ?? optional_text($input, 'unit_id', 36);
            $requestedUnitCode = optional_text($input, 'unitCode', 100)
                ?? optional_text($input, 'unit_code', 100);
            if ($requestedUnitId === null && $requestedUnitCode === null) {
                $unitId = null;
                $unitCode = null;
                $unitName = null;
                $regionId = null;
                $regionCode = null;
                $dashboardRegion = null;
            } else {
                if ($requestedUnitId !== null
                    && !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i', $requestedUnitId)) {
                    $pdo->rollBack();
                    fail(400, 'bad-request', 'Invalid unit id.');
                }
                $locationSql = $requestedUnitId !== null
                    ? 'unit.unit_id = CAST(:location_key AS uuid)'
                    : 'UPPER(unit.unit_code) = UPPER(:location_key)';
                $locationStmt = $pdo->prepare(
                    "SELECT unit.unit_id, unit.unit_code, unit.unit_name,
                            region.region_id, region.region_code, region.region_name,
                            region.dashboard_group
                       FROM org_units unit
                       JOIN regions region ON region.region_id = unit.region_id
                      WHERE $locationSql
                        AND unit.is_active = TRUE
                        AND region.is_active = TRUE"
                );
                $locationStmt->execute([
                    'location_key' => $requestedUnitId ?? strtoupper((string)$requestedUnitCode),
                ]);
                $location = $locationStmt->fetch();
                if (!$location) {
                    $pdo->rollBack();
                    fail(400, 'bad-request', 'Selected unit is unavailable or is not in the organization catalog.');
                }
                $unitId = $location['unit_id'];
                $unitCode = $location['unit_code'];
                $unitName = $location['unit_name'];
                $regionId = $location['region_id'];
                $regionCode = $location['region_code'];
                $dashboardRegion = $location['dashboard_group'] ?: $location['region_name'];
            }
        }

        $isTerminated = array_key_exists('isTerminated', $input)
            ? (bool)$input['isTerminated']
            : (array_key_exists('is_terminated', $input) ? (bool)$input['is_terminated'] : database_boolean($existing['is_terminated'] ?? false));
        $terminationDate = roster_optional_date_input($input, 'terminationDate')
            ?? roster_optional_date_input($input, 'termination_date')
            ?? ($isTerminated ? ($existing['termination_date'] ?? (new DateTimeImmutable())->format('Y-m-d')) : null);
        $terminationReason = optional_text($input, 'terminationReason', 500)
            ?? optional_text($input, 'termination_reason', 500)
            ?? ($isTerminated ? ($existing['termination_reason'] ?? 'Cập nhật từ dashboard') : null);
        if (!$isTerminated) {
            $terminationDate = null;
            $terminationReason = null;
        }

        $update = $pdo->prepare(
            'UPDATE users
                SET email = :email,
                    display_name = :display_name,
                    job_title = :job_title,
                    training_start_date = :training_start_date,
                    training_end_date = :training_end_date,
                    class_code = :class_code,
                    is_terminated = :is_terminated,
                    termination_date = :termination_date,
                    termination_reason = :termination_reason,
                    unit_id = :unit_id,
                    unit_code = :unit_code,
                    unit_name = :unit_name,
                    region_code = :region_code,
                    dashboard_region = :dashboard_region,
                    region_id = :region_id,
                    employee_source = COALESCE(employee_source, :employee_source),
                    employee_synced_at = NOW(),
                    updated_at = NOW()
              WHERE employee_id = :employee_id
              RETURNING *'
        );
        $update->execute([
            'email' => $email,
            'display_name' => $displayName,
            'job_title' => optional_text($input, 'jobTitle', 200)
                ?? optional_text($input, 'job_title', 200)
                ?? ($existing['job_title'] ?? null),
            'training_start_date' => roster_optional_date_input($input, 'trainingStartDate')
                ?? roster_optional_date_input($input, 'training_start_date')
                ?? ($existing['training_start_date'] ?? null),
            'training_end_date' => roster_optional_date_input($input, 'trainingEndDate')
                ?? roster_optional_date_input($input, 'training_end_date')
                ?? ($existing['training_end_date'] ?? null),
            'class_code' => optional_text($input, 'classCode', 50)
                ?? optional_text($input, 'class_code', 50)
                ?? ($existing['class_code'] ?? null),
            'is_terminated' => $isTerminated,
            'termination_date' => $terminationDate,
            'termination_reason' => $terminationReason,
            'unit_id' => $unitId,
            'unit_code' => $unitCode,
            'unit_name' => $unitName,
            'region_code' => $regionCode ? strtoupper($regionCode) : null,
            'dashboard_region' => $dashboardRegion,
            'region_id' => $regionId,
            'employee_source' => KTV_ROSTER_IMPORT_SOURCE,
            'employee_id' => $employeeId,
        ]);
        $updated = $update->fetch();
        if (!$updated) {
            $pdo->rollBack();
            fail(500, 'save-failed', 'Roster update returned no data.');
        }
        $snapshotUpdate = $pdo->prepare(
            <<<'SQL'
            WITH target AS (
                SELECT CAST(:unit_id AS uuid) AS unit_id,
                       CAST(:region_id AS uuid) AS region_id
            )
            UPDATE lab_assignments assignment
               SET unit_id_snapshot = target.unit_id,
                   region_id_snapshot = target.region_id,
                   updated_at = NOW()
              FROM class_enrollments enrollment, target
             WHERE enrollment.enrollment_id = assignment.enrollment_id
               AND enrollment.user_id = :user_id
               AND (
                   assignment.unit_id_snapshot IS DISTINCT FROM target.unit_id
                   OR assignment.region_id_snapshot IS DISTINCT FROM target.region_id
               )
            SQL
        );
        $snapshotUpdate->execute([
            'unit_id' => $unitId,
            'region_id' => $regionId,
            'user_id' => $updated['user_id'],
        ]);
        $directoryStmt = $pdo->prepare('SELECT * FROM v_ktv_directory WHERE user_id = :user_id');
        $directoryStmt->execute(['user_id' => $updated['user_id']]);
        $directoryRow = $directoryStmt->fetch() ?: $updated;
        $pdo->commit();
        respond(['item' => roster_item_response($directoryRow)]);
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $exception;
    }
}

function build_roster_report_input(array $input = []): array
{
    $filters = $input['filters'] ?? null;
    if ($filters !== null && !is_array($filters)) {
        fail(400, 'bad-filter', 'Roster filters must be an object.');
    }
    $filters = $filters ?? [
        'status' => $_GET['status'] ?? 'active',
        'employeeId' => $_GET['employeeId'] ?? '',
        'name' => $_GET['name'] ?? '',
        'email' => $_GET['email'] ?? '',
        'jobTitle' => $_GET['jobTitle'] ?? '',
        'region' => $_GET['region'] ?? '',
        'branch' => $_GET['branch'] ?? '',
        'className' => $_GET['className'] ?? '',
    ];

    $pdo = db();
    $params = [];
    $where = roster_base_where($params, true, $filters);
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
    $classJoinSql = roster_assigned_class_join_sql();
    $stmt = $pdo->prepare(
        "SELECT ktv.*, assigned_class.assigned_class_code, assigned_class.assigned_class_name
           FROM v_ktv_directory ktv
           $classJoinSql
          $whereSql
          ORDER BY ktv.region_name NULLS LAST, ktv.branch_name NULLS LAST, ktv.display_name NULLS LAST, ktv.email"
    );
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $rawStatuses = $filters['status'] ?? 'active';
    $statusValues = is_array($rawStatuses) ? $rawStatuses : [$rawStatuses];
    $statusValues = array_values(array_unique(array_filter(array_map(
        static fn (mixed $value): string => strtolower(trim((string)$value)),
        $statusValues
    ), static fn (string $value): bool => $value !== '' && $value !== 'all')));
    $statusLabel = match (true) {
        $statusValues === ['terminated'] => 'Đã nghỉ',
        $statusValues === ['active'] => 'Đang công tác',
        $statusValues === ['__ftc_none_selected__'] => 'Không chọn trạng thái nào',
        default => 'Tất cả trạng thái',
    };
    $filterLabels = [
        'employeeId' => 'Mã NV',
        'name' => 'Họ tên',
        'email' => 'Email',
        'jobTitle' => 'Vị trí',
        'region' => 'Khu vực',
        'branch' => 'Chi nhánh',
        'className' => 'Lớp',
    ];
    $scopeParts = [$statusLabel];
    $metadata = [['Trạng thái', $statusLabel]];
    foreach ($filterLabels as $key => $label) {
        $rawValue = $filters[$key] ?? '';
        $values = is_array($rawValue) ? $rawValue : [$rawValue];
        $values = array_values(array_filter(array_map(
            static fn (mixed $value): string => trim((string)$value),
            $values
        ), static fn (string $value): bool => $value !== '' && $value !== '__FTC_NONE_SELECTED__'));
        if (!$values) {
            continue;
        }
        $value = implode(', ', $values);
        $scopeParts[] = $label . ': ' . $value;
        $metadata[] = [$label, $value];
    }
    $dataRows = [];
    foreach ($rows as $index => $row) {
        $row = roster_item_response($row);
        $dataRows[] = [
            $index + 1,
            $row['employee_id'] ?? '',
            $row['display_name'] ?? '',
            $row['email'] ?? '',
            $row['job_title'] ?? '',
            $row['dashboard_region'] ?? $row['region_name'] ?? '',
            $row['branch_name'] ?? '',
            $row['class_name'] ?? 'Chưa xếp lớp',
            database_boolean($row['is_terminated'] ?? false) ? 'Đã nghỉ' : 'Đang công tác',
        ];
    }

    return [
        'type' => 'roster',
        'period' => 'Tại thời điểm xuất',
        'scope' => implode(' · ', $scopeParts),
        'filename' => $input['filename'] ?? 'FTC_Danh_sach_KTV',
        'metadata' => $metadata,
        'headers' => [
            'STT', 'Mã NV', 'Họ và tên', 'Email', 'Vị trí',
            'Khu vực/CNx', 'Chi nhánh', 'Lớp', 'Trạng thái',
        ],
        'columnTypes' => ['integer', 'text', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
        'rows' => $dataRows,
    ];
}

function stream_report_input(array $input, array $actor): void
{
    try {
        $timezone = new DateTimeZone(normalize_app_timezone(env_value('APP_TIMEZONE')));
        $report = ftc_report_xlsx_normalize_descriptor($input, $actor, $timezone);
        ftc_report_xlsx_stream($report);
    } catch (InvalidArgumentException $exception) {
        fail(400, 'invalid-report', $exception->getMessage());
    } catch (Throwable $exception) {
        report_exception($exception, 'report-export');
        fail(500, 'report-export-failed', 'Không thể tạo file Excel. Vui lòng thử lại.');
    }
}

function handle_roster_export(array $actor): void
{
    stream_report_input(build_roster_report_input(), $actor);
}

function handle_reports(array $segments, string $method): void
{
    $action = $segments[1] ?? '';
    if ($action !== 'export') {
        fail(404, 'not-found', 'Report endpoint not found.');
    }
    if ($method !== 'POST') {
        fail(405, 'method-not-allowed', 'Report export only supports POST.');
    }

    // Kiểm tra quyền trước khi đọc body báo cáo có thể lớn.
    $actor = require_report_export();
    $input = report_json_body();
    $typeValue = $input['type'] ?? '';
    if (!is_string($typeValue)) {
        fail(400, 'invalid-report', 'Loại báo cáo không hợp lệ.');
    }
    $type = strtolower(trim($typeValue));
    if ($type === 'roster') {
        $input = build_roster_report_input($input);
    }
    stream_report_input($input, $actor);
}

function handle_roster(array $segments, string $method): void
{
    $actor = require_admin();
    $action = $segments[1] ?? '';

    if ($action === 'import' && $method === 'POST') {
        handle_roster_import($actor);
    } elseif ($action === 'list' && $method === 'GET') {
        handle_roster_list();
    } elseif ($action === 'meta' && $method === 'GET') {
        handle_roster_meta();
    } elseif ($action === 'regions' && $method === 'GET') {
        handle_roster_regions();
    } elseif ($action === 'history' && $method === 'GET') {
        handle_roster_history();
    } elseif ($action === 'export' && $method === 'GET') {
        require_report_export($actor);
        handle_roster_export($actor);
    } elseif ($action !== '' && $method === 'PATCH') {
        handle_roster_update(rawurldecode($action));
    }

    fail(404, 'not-found', 'Roster endpoint not found.');
}

function training_class_uploaded_file(): array
{
    $file = $_FILES['file'] ?? $_FILES['workbook'] ?? null;
    if (!is_array($file)) {
        fail(400, 'bad-request', 'Missing class assignment workbook.');
    }
    $error = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error !== UPLOAD_ERR_OK) {
        fail(400, 'upload-error', 'Unable to receive class assignment workbook.');
    }
    $maximumBytes = env_int('CLASS_IMPORT_MAX_BYTES', TRAINING_CLASS_IMPORT_MAX_BYTES, 1024, 20 * 1024 * 1024);
    if ((int)($file['size'] ?? 0) > $maximumBytes) {
        fail(413, 'payload-too-large', 'Class assignment workbook exceeds the allowed size.');
    }
    $name = (string)($file['name'] ?? '');
    if (!preg_match('/\.xlsx$/iD', $name)) {
        fail(400, 'bad-request', 'Class assignment import must be an .xlsx workbook.');
    }
    $path = (string)($file['tmp_name'] ?? '');
    if ($path === '' || !is_uploaded_file($path)) {
        fail(400, 'upload-error', 'Uploaded class assignment workbook is not available.');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path);
    $allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream',
    ];
    if (!in_array($mime, $allowedMimeTypes, true)) {
        fail(400, 'bad-workbook', 'Uploaded file content is not a valid XLSX workbook.');
    }
    $zip = new ZipArchive();
    if ($zip->open($path) !== true || $zip->locateName('xl/workbook.xml') === false || $zip->numFiles > 1000) {
        if ($zip->status === ZipArchive::ER_OK) {
            $zip->close();
        }
        fail(400, 'bad-workbook', 'Uploaded file is not a valid XLSX package.');
    }
    $expandedBytes = 0;
    for ($index = 0; $index < $zip->numFiles; $index++) {
        $stat = $zip->statIndex($index);
        $expandedBytes += (int)($stat['size'] ?? 0);
        if ($expandedBytes > 64 * 1024 * 1024) {
            $zip->close();
            fail(413, 'workbook-too-large', 'Expanded workbook content exceeds the allowed size.');
        }
    }
    $zip->close();
    return ['path'=>$path, 'name'=>$name, 'size'=>(int)($file['size'] ?? 0)];
}

function handle_training_class_member_preview(): void
{
    $className = trim((string)($_POST['class_name'] ?? $_POST['className'] ?? ''));
    if ($className === '' || mb_strlen($className, 'UTF-8') > 200) {
        fail(400, 'bad-request', 'Tên lớp là bắt buộc và không được vượt quá 200 ký tự.');
    }
    $validFrom = training_class_date($_POST['valid_from'] ?? $_POST['validFrom'] ?? null, 'validFrom');
    training_class_assert_dates($validFrom);
    $file = training_class_uploaded_file();
    try {
        $parsed = parse_training_class_members_xlsx($file['path']);
    } catch (Throwable $exception) {
        report_exception($exception, 'class-member-preview');
        fail(400, 'bad-workbook', 'Không thể đọc file danh sách KTV.');
    }
    $validated = validate_training_class_member_preview(db(), $parsed);
    $existingCount = count(array_filter($validated['members'], static fn(array $member): bool => ($member['action'] ?? '') === 'existing'));
    $newCount = count(array_filter($validated['members'], static fn(array $member): bool => ($member['action'] ?? '') === 'create'));
    respond(['data'=>[
        'file_name'=>$file['name'],
        'member_count'=>count($validated['members']),
        'existing_count'=>$existingCount,
        'new_count'=>$newCount,
        'error_count'=>count($validated['errors']),
        'warning_count'=>count($validated['warnings']),
        'members'=>$validated['members'],
        'errors'=>$validated['errors'],
        'warnings'=>$validated['warnings'],
        'can_apply'=>count($validated['errors']) === 0 && count($validated['members']) > 0,
    ]]);
}

function handle_training_class_import(array $actor): void
{
    $file = training_class_uploaded_file();
    try {
        $parsed = parse_training_class_xlsx($file['path']);
    } catch (Throwable $exception) {
        report_exception($exception, 'class-import-parse');
        fail(400, 'bad-workbook', 'Unable to read the class assignment workbook.');
    }
    $validated = validate_training_class_import(db(), $parsed);
    $batchId = trim((string)($_POST['batch_id'] ?? ''));
    if ($batchId === '') {
        $batchId = 'class-assignment-' . gmdate('Ymd-His') . '-' . bin2hex(random_bytes(4));
    }
    if (!preg_match('/^[A-Za-z0-9._:-]{8,100}$/D', $batchId)) {
        fail(400, 'bad-request', 'Invalid class assignment import batch id.');
    }
    $preview = [
        'batch_id'=>$batchId,
        'file_name'=>$file['name'],
        'class_count'=>count($validated['classes']),
        'member_count'=>count($validated['members']),
        'device_count'=>count($validated['devices']),
        'error_count'=>count($validated['errors']),
        'errors'=>$validated['errors'],
        'can_import'=>count($validated['errors']) === 0 && count($validated['classes']) > 0,
    ];
    if (roster_parse_bool_query('dry_run') || roster_parse_bool_query('dryRun')) {
        respond(['data'=>$preview]);
    }
    if (!$preview['can_import']) {
        respond(['error'=>[
            'code'=>'class-import-conflict',
            'message'=>'Class assignment workbook contains invalid data.',
            'requestId'=>$GLOBALS['request_id'] ?? null,
            'details'=>$validated['errors'],
        ]], 409);
    }
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $result = apply_training_class_import($pdo, $validated, $batchId, $actor, $file['name']);
        $pdo->commit();
        respond(['data'=>$result]);
    } catch (Throwable $exception) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        report_exception($exception, 'class-import-apply');
        fail(500, 'class-import-failed', 'Unable to apply the class assignment workbook.');
    }
}

function handle_training_classes(array $segments, string $method): void
{
    $actor = require_admin();
    $action = $segments[1] ?? '';
    if ($action === '' && $method === 'GET') {
        respond(['items'=>training_class_list(db())]);
    }
    if ($action === '' && $method === 'POST') {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $class = training_class_create(
                $pdo,
                json_body_with_limit(env_int('CLASS_API_MAX_BODY_BYTES', 1048576, 65536, 4194304)),
                $actor
            );
            $pdo->commit();
            respond(['item'=>$class], 201);
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }
    }
    if ($action === 'catalog' && $method === 'GET') {
        respond(['data'=>training_class_catalog(db())]);
    }
    if ($action === 'members' && ($segments[2] ?? '') === 'template' && $method === 'GET') {
        stream_training_class_member_template();
    }
    if ($action === 'members' && ($segments[2] ?? '') === 'preview' && $method === 'POST') {
        handle_training_class_member_preview();
    }
    if ($action === 'template' && $method === 'GET') {
        stream_training_class_import_template();
    }
    if ($action === 'import' && $method === 'POST') {
        handle_training_class_import($actor);
    }
    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $action) && $method === 'GET') {
        respond(['item'=>training_class_detail(db(), $action)]);
    }
    if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $action) && $method === 'PATCH') {
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $class = training_class_update(
                $pdo,
                $action,
                json_body_with_limit(env_int('CLASS_API_MAX_BODY_BYTES', 1048576, 65536, 4194304))
            );
            $pdo->commit();
            respond(['item' => $class]);
        } catch (Throwable $exception) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $exception;
        }
    }
    fail(404, 'not-found', 'Training class endpoint not found.');
}

function handle_learning(array $segments, string $method): void
{
    $user = require_user();
    $action = $segments[1] ?? '';
    if ($action === 'catalog' && $method === 'GET') {
        respond_private_cache(
            ['devices' => training_class_learning_catalog(db(), $user)],
            env_int('LEARNING_CATALOG_CACHE_SECONDS', 21600, 300, 86400)
        );
    }
    if (($action === 'personal-dashboard' || $action === 'me' || $action === 'progress') && $method === 'GET') {
        respond(['data' => training_class_personal_dashboard_payload(db(), $user)]);
    }
    fail(404, 'not-found', 'Learning endpoint not found.');
}

function handle_dashboard(array $segments, string $method): void
{
    if ($method !== 'GET') {
        fail(405, 'method-not-allowed', 'Dashboard endpoint only supports GET.');
    }

    require_admin();

    $action = $segments[1] ?? '';

    if ($action === 'report') {
        try {
            $reportStartedAt = microtime(true);
            $pdo = db();
            $statementTimeoutMs = env_int('DASHBOARD_REPORT_STATEMENT_TIMEOUT_MS', 20000, 1000, 120000);
            $pdo->exec('SET statement_timeout = ' . $statementTimeoutMs);
            $report = dashboard_report_cached_payload($pdo, $_GET);
            $reportDurationMs = (int)round((microtime(true) - $reportStartedAt) * 1000);
            header('X-Dashboard-Cache: ' . ($GLOBALS['dashboard_report_cache_status'] ?? 'unknown'));
            header('Server-Timing: dashboard;dur=' . $reportDurationMs);
            respond(['data' => $report]);
        } catch (InvalidArgumentException $exception) {
            fail(400, 'invalid-report-period', $exception->getMessage());
        } catch (Throwable $exception) {
            report_exception($exception, 'dashboard-report');
            fail(500, 'dashboard-report-failed', 'Unable to load dashboard report.');
        }
    }

    if ($action === 'version') {
        $pdo = db();
        try {
            respond(['data' => ['data_version' => dashboard_report_data_version($pdo)]]);
        } catch (Throwable $exception) {
            report_exception($exception, 'dashboard-version');
            fail(500, 'dashboard-version-failed', 'Unable to load dashboard version.');
        }
    }

    if ($action === 'catalog') {
        $pdo = db();
        $includeTechnicians = !array_key_exists('include_technicians', $_GET)
            || filter_var($_GET['include_technicians'], FILTER_VALIDATE_BOOLEAN);
        $technicians = $includeTechnicians ? $pdo->query(
            <<<'SQL'
            SELECT user_id, employee_id, email, display_name, class_code, job_title,
                   unit_id, unit_code, unit_name, region_id, region_code, region_name,
                   dashboard_region, dashboard_group, branch_name, location_assigned,
                   is_terminated, last_login_at, updated_at
              FROM v_ktv_directory
             WHERE is_terminated = FALSE
             ORDER BY display_name NULLS LAST, email
            SQL
        )->fetchAll() : [];
        $catalogRows = $pdo->query(
            <<<'SQL'
            SELECT device.device_id, device.model, device.device_name,
                   lab.lab_id, lab.lab_name
              FROM device_catalog device
              LEFT JOIN lab_catalog lab
                ON lab.device_id = device.device_id AND lab.is_active = TRUE
             WHERE device.is_active = TRUE
             ORDER BY device.sort_order, device.device_name, lab.sort_order, lab.lab_name
            SQL
        )->fetchAll();
        $devices = [];
        $labs = [];
        foreach ($catalogRows as $row) {
            $deviceId = (string)$row['device_id'];
            $devices[$deviceId] = [
                'device_id' => $deviceId,
                'model' => (string)($row['model'] ?? ''),
                'device_name' => (string)$row['device_name'],
            ];
            if (!empty($row['lab_id'])) {
                $labs[(string)$row['lab_id']] = [
                    'lab_id' => (string)$row['lab_id'],
                    'lab_name' => (string)$row['lab_name'],
                    'device_id' => $deviceId,
                ];
            }
        }
        respond_private_cache(['data' => [
            'technicians' => array_values($technicians),
            'technicians_included' => $includeTechnicians,
            'devices' => array_values($devices),
            'labs' => array_values($labs),
        ]], env_int('DASHBOARD_CATALOG_CACHE_SECONDS', 21600, 300, 86400));
    }

    if ($action === 'technician-filter-options') {
        $items = db()->query(
            <<<'SQL'
            SELECT LOWER(email) AS email,
                   COALESCE(NULLIF(display_name, ''), LOWER(email)) AS display_name
              FROM v_ktv_directory
             WHERE is_terminated = FALSE
               AND NULLIF(email, '') IS NOT NULL
             ORDER BY display_name NULLS LAST, email
            SQL
        )->fetchAll();
        respond_private_cache(['data' => ['items' => array_values($items)]],
            env_int('DASHBOARD_CATALOG_CACHE_SECONDS', 21600, 300, 86400));
    }

    if (!in_array($action, ['all', 'technicians', 'technician-sessions'], true)) {
        fail(404, 'not-found', 'Dashboard endpoint not found.');
    }

    $dateFrom = trim((string)($_GET['from'] ?? ''));
    $dateTo = trim((string)($_GET['to'] ?? ''));
    $validDate = static function (string $value): bool {
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        return $parsed instanceof DateTimeImmutable && $parsed->format('Y-m-d') === $value;
    };
    if (!$validDate($dateFrom) || !$validDate($dateTo)) {
        fail(400, 'dashboard-range-required', 'Dashboard detail requires valid from and to dates.');
    }
    $rangeStart = new DateTimeImmutable($dateFrom);
    $rangeEnd = new DateTimeImmutable($dateTo);
    $maxRangeDays = env_int('DASHBOARD_MAX_RANGE_DAYS', 366, 1, 3660);
    if ($rangeEnd < $rangeStart || (int)$rangeStart->diff($rangeEnd)->format('%a') + 1 > $maxRangeDays) {
        fail(400, 'dashboard-range-invalid', 'Dashboard detail date range is invalid or too large.');
    }

    if ($action === 'technicians') {
        $decodeList = static function (string $name): array {
            $raw = trim((string)($_GET[$name] ?? ''));
            if ($raw === '') return [];
            try {
                $values = json_decode($raw, true, 128, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                fail(400, 'invalid-dashboard-filter', 'Dashboard filter must be a JSON array.');
            }
            if (!is_array($values) || count($values) > 100) {
                fail(400, 'invalid-dashboard-filter', 'Dashboard filter has too many values.');
            }
            $normalized = [];
            foreach ($values as $value) {
                if (!is_scalar($value)) {
                    fail(400, 'invalid-dashboard-filter', 'Dashboard filter contains an invalid value.');
                }
                $text = trim((string)$value);
                if ($text === '' || mb_strlen($text) > 200) continue;
                $normalized[] = $text;
            }
            return array_values(array_unique($normalized));
        };
        $search = trim((string)($_GET['search'] ?? ''));
        if (mb_strlen($search) > 200) {
            fail(400, 'invalid-dashboard-search', 'Dashboard search is too long.');
        }
        $page = filter_var($_GET['page'] ?? 1, FILTER_VALIDATE_INT);
        if ($page === false || $page < 1 || $page > 100000) {
            fail(400, 'invalid-dashboard-page', 'Dashboard page is invalid.');
        }
        $limit = query_limit(
            env_int('DASHBOARD_TECHNICIAN_PAGE_SIZE', 25, 10, 100),
            100
        );
        $payload = dashboard_technician_summary_page(
            db(),
            $dateFrom,
            $dateTo,
            [
                'search' => $search,
                'regions' => $decodeList('regions'),
                'devices' => $decodeList('devices'),
                'labs' => $decodeList('labs'),
                'identities' => $decodeList('identities'),
            ],
            $limit,
            ($page - 1) * $limit,
            trim((string)($_GET['sort'] ?? 'lastDateTimeMs')),
            trim((string)($_GET['direction'] ?? 'desc'))
        );
        $payload['page']['number'] = (int)$page;
        respond(['data' => $payload]);
    }

    if ($action === 'technician-sessions') {
        $personId = trim((string)($_GET['person_id'] ?? ''));
        if ($personId === '' || strlen($personId) > 400) {
            fail(400, 'invalid-technician-identity', 'Technician identity is invalid.');
        }
        $limit = query_limit(
            env_int('DASHBOARD_TECHNICIAN_HISTORY_PAGE_SIZE', 50, 12, 200),
            200
        );
        $cursor = decode_cursor(isset($_GET['cursor']) ? (string)$_GET['cursor'] : null);
        $result = dashboard_technician_session_page(
            db(),
            $personId,
            $dateFrom,
            $dateTo,
            $limit,
            $cursor
        );
        $rows = $result['rows'];
        $sessions = array_map(static fn(array $row): array => [
            'session_id' => (string)$row['session_id'],
            'technician_id' => (string)($row['employee_id'] ?? ''),
            'full_name' => (string)($row['display_name'] ?? ''),
            'email' => (string)($row['email'] ?? ''),
            'region_name' => (string)($row['region'] ?? 'FTC'),
            'job_title' => (string)($row['job_title'] ?? ''),
            'unit_code' => (string)($row['unit_code'] ?? ''),
            'unit_name' => (string)($row['unit_name'] ?? ''),
            'branch_name' => (string)($row['branch_name'] ?? ''),
            'class_code' => (string)($row['class_code'] ?? ''),
            'started_at' => safe_datetime($row['occurred_at'] ?? null),
            'duration_sec' => $row['duration_sec'] !== null ? (int)$row['duration_sec'] : null,
            'mode' => (string)($row['mode'] ?? 'Thực hành'),
            'device_id' => (string)($row['device_id'] ?? ''),
            'device_name' => (string)($row['device_name'] ?? ''),
            'lab_id' => (string)($row['lab_id'] ?? ''),
            'lab_name' => (string)($row['lab_name'] ?? ''),
            'is_passed' => isset($row['is_passed']) ? (bool)$row['is_passed'] : null,
            'status' => (string)($row['status'] ?? 'completed'),
            'completed_first_try' => database_nullable_boolean($row['completed_first_try'] ?? null),
            'practice_attempt_no' => $row['practice_attempt_no'] !== null ? (int)$row['practice_attempt_no'] : null,
            'attempt_sequence_complete' => database_boolean($row['attempt_sequence_complete'] ?? true),
            'seed_batch' => (string)($row['seed_batch'] ?? ''),
            'last_action' => (string)($row['last_action'] ?? ''),
            'assignment_class_codes' => [],
        ], $rows);
        $last = $rows ? $rows[array_key_last($rows)] : null;
        respond(['data' => [
            'sessions' => $sessions,
            'session_page' => [
                'from' => $dateFrom,
                'to' => $dateTo,
                'limit' => $limit,
                'has_more' => $result['has_more'],
                'next_cursor' => $result['has_more'] && $last
                    ? encode_cursor([
                        'started_at' => (string)$last['occurred_at'],
                        'session_id' => (string)$last['session_id'],
                    ])
                    : null,
            ],
        ]]);
    }

    $sessionLimit = query_limit(
        env_int('DASHBOARD_SESSION_PAGE_SIZE', 500, 50, 1000),
        1000
    );
    $sessionCursor = decode_cursor(isset($_GET['cursor']) ? (string)$_GET['cursor'] : null);
    $includeSessions = !array_key_exists('include_sessions', $_GET)
        || filter_var($_GET['include_sessions'], FILTER_VALIDATE_BOOLEAN);

    $pdo = db();
    try {
        $userLookupRows = [];
        if ($includeSessions) {
            $userLookupStatement = $pdo->prepare(
            'SELECT directory.user_id, directory.employee_id, directory.email, directory.display_name,
                    directory.class_code, directory.job_title, directory.unit_code, directory.unit_name,
                    directory.region_id, directory.region_code, directory.region_name,
                    directory.dashboard_region, directory.dashboard_group, directory.branch_name,
                    directory.is_terminated
               FROM v_ktv_directory directory
              WHERE EXISTS (
                    SELECT 1
                      FROM timer_sessions timer
                     WHERE COALESCE(timer.started_at, timer.finished_at) >= :lookup_from
                       AND COALESCE(timer.started_at, timer.finished_at) < (:lookup_to::date + INTERVAL \'1 day\')
                       AND (
                           timer.user_id = directory.user_id
                           OR (NULLIF(timer.email, \'\') IS NOT NULL AND LOWER(timer.email) = LOWER(directory.email))
                           OR (NULLIF(timer.technician_id, \'\') IS NOT NULL AND timer.technician_id = directory.employee_id)
                       )
              )'
        );
            $userLookupStatement->execute(['lookup_from' => $dateFrom, 'lookup_to' => $dateTo]);
            $userLookupRows = $userLookupStatement->fetchAll();
        }

        $userByUserId = [];
        $userByEmployeeId = [];
        $userByEmail = [];
        foreach ($userLookupRows as $u) {
            $uid = (string)($u['user_id'] ?? '');
            $eid = (string)($u['employee_id'] ?? '');
            $em  = strtolower(trim((string)($u['email'] ?? '')));
            if ($uid !== '') $userByUserId[$uid] = $u;
            if ($eid !== '') $userByEmployeeId[$eid] = $u;
            if ($em !== '') $userByEmail[$em] = $u;
        }
        unset($userLookupRows);

        $rows = [];
        $hasMoreSessions = false;
        $nextSessionCursor = null;
        if ($includeSessions) {
            $timerSql = 'SELECT
                    timer.id AS session_id,
                    timer.user_id,
                    timer.technician_id,
                    timer.name,
                    timer.email,
                    COALESCE(timer.started_at, timer.finished_at) AS started_at,
                    timer.duration_sec,
                    timer.mode,
                    active_device.device_id,
                    active_device.device_name,
                    active_lab.lab_id,
                    active_lab.lab_name,
                    timer.is_passed,
                    timer.status,
                    timer.completed_first_try,
                    timer.last_action,
                    timer.practice_attempt_no,
                    timer.attempt_sequence_complete,
                    timer.seed_batch,
                    COALESCE(attribution.class_codes, \'[]\'::jsonb) AS assignment_class_codes
                 FROM timer_sessions timer
                 JOIN lab_catalog active_lab ON active_lab.lab_id = timer.lab_id
                 JOIN device_catalog active_device ON active_device.device_id = active_lab.device_id
                  LEFT JOIN LATERAL (
                      SELECT TO_JSONB(ARRAY_AGG(DISTINCT training.class_code ORDER BY training.class_code)) AS class_codes
                        FROM timer_session_assignment_links link
                        JOIN lab_assignments assignment ON assignment.assignment_id = link.assignment_id
                        JOIN training_classes training ON training.class_id = assignment.class_id_snapshot
                       WHERE link.timer_session_id = timer.id
                  ) attribution ON TRUE
                 WHERE (
                     timer.user_id IS NOT NULL
                     OR (timer.email IS NOT NULL AND timer.email != \'\')
                     OR (timer.technician_id IS NOT NULL AND timer.technician_id != \'\')
                 )
                   AND NOT COALESCE(timer.is_mock, FALSE)
                   AND timer.status IN (\'completed\', \'failed\')
                   AND (
                       EXISTS (
                           SELECT 1
                             FROM v_ktv_directory directory
                            WHERE directory.is_terminated = FALSE
                              AND (
                                  (timer.user_id IS NOT NULL AND directory.user_id = timer.user_id)
                                  OR (NULLIF(timer.email, \'\') IS NOT NULL AND LOWER(directory.email) = LOWER(timer.email))
                                  OR (NULLIF(timer.technician_id, \'\') IS NOT NULL AND directory.employee_id = timer.technician_id)
                              )
                       )
                       OR EXISTS (
                           SELECT 1
                             FROM firebase_legacy_import_events legacy
                            WHERE legacy.timer_session_id = timer.id
                              AND legacy.account_group = \'KTV\'
                              AND legacy.resolution_status = \'imported\'
                       )
                   )
                   AND NOT (
                     timer.user_id IS NULL
                     AND (
                         timer.technician_id = :bypass_anon
                         OR timer.technician_id = :bypass_uuid
                         OR timer.technician_id = :bypass_empty
                         OR timer.email = :bypass_email_empty
                         OR timer.email = :bypass_email_dev
                     )
                 )';
        $timerParams = [
            'bypass_anon'        => 'ANONYMOUS',
            'bypass_uuid'        => '00000000-0000-0000-0000-000000000001',
            'bypass_empty'       => '',
            'bypass_email_empty' => '',
            'bypass_email_dev'   => 'dev-bypass@ftc.local',
        ];

        $timerSql .= ' AND COALESCE(timer.started_at, timer.finished_at) >= :date_from';
        $timerSql .= ' AND COALESCE(timer.started_at, timer.finished_at) < (:date_to::date + INTERVAL \'1 day\')';
        $timerParams['date_from'] = $dateFrom . 'T00:00:00+07:00';
        $timerParams['date_to'] = $dateTo;
        if (isset($sessionCursor['started_at'], $sessionCursor['session_id'])) {
            $timerSql .= ' AND (COALESCE(timer.started_at, timer.finished_at), timer.id) < (:cursor_started_at, CAST(:cursor_session_id AS BIGINT))';
            $timerParams['cursor_started_at'] = (string)$sessionCursor['started_at'];
            $timerParams['cursor_session_id'] = (string)$sessionCursor['session_id'];
        }
        $timerSql .= ' ORDER BY COALESCE(timer.started_at, timer.finished_at) DESC, timer.id DESC LIMIT ' . ($sessionLimit + 1);

        $timerStmt = $pdo->prepare($timerSql);
        foreach ($timerParams as $k => $v) {
            $timerStmt->bindValue(':' . $k, $v);
        }
        $timerStmt->execute();
        $rows = $timerStmt->fetchAll();
        $hasMoreSessions = count($rows) > $sessionLimit;
        if ($hasMoreSessions) {
            array_pop($rows);
        }
        $lastSessionRow = $rows ? $rows[array_key_last($rows)] : null;
            $nextSessionCursor = $hasMoreSessions && $lastSessionRow
                ? encode_cursor([
                    'started_at' => (string)$lastSessionRow['started_at'],
                    'session_id' => (string)$lastSessionRow['session_id'],
                ])
                : null;
        }

        $resolveRoster = function (?array $tRow) use ($userByUserId, $userByEmployeeId, $userByEmail): ?array {
            $uid = (string)($tRow['user_id'] ?? '');
            $eid = trim((string)($tRow['technician_id'] ?? ''));
            $em  = strtolower(trim((string)($tRow['email'] ?? '')));
            if ($uid !== '' && isset($userByUserId[$uid])) return $userByUserId[$uid];
            if ($eid !== '' && isset($userByEmployeeId[$eid])) return $userByEmployeeId[$eid];
            if ($em !== '' && isset($userByEmail[$em])) return $userByEmail[$em];
            return null;
        };

        $includeCatalog = array_key_exists('include_catalog', $_GET)
            && filter_var($_GET['include_catalog'], FILTER_VALIDATE_BOOLEAN);
        $technicianRows = $includeCatalog ? $pdo
            ->query(
                <<<'SQL'
                SELECT directory.*,
                        assigned_class.class_code AS active_class_code,
                        assigned_class.class_name AS active_class_name
                   FROM v_ktv_directory directory
                   LEFT JOIN LATERAL (
                       SELECT STRING_AGG(DISTINCT training.class_code, ', ' ORDER BY training.class_code) AS class_code,
                              STRING_AGG(DISTINCT training.class_name, ', ' ORDER BY training.class_name) AS class_name
                         FROM class_enrollments enrollment
                         JOIN training_classes training ON training.class_id = enrollment.class_id
                        WHERE enrollment.user_id = directory.user_id
                          AND enrollment.status = 'active'
                          AND enrollment.is_mock = FALSE
                          AND (enrollment.valid_to IS NULL OR enrollment.valid_to >= CURRENT_DATE)
                          AND training.status IN ('planned', 'active')
                          AND training.is_mock = FALSE
                   ) assigned_class ON TRUE
                  WHERE directory.is_terminated = FALSE
                  ORDER BY assigned_class.class_code NULLS LAST,
                           directory.class_code NULLS LAST,
                           directory.display_name NULLS LAST, directory.email
                SQL
            )
            ->fetchAll() : [];

        $firebaseFtcRows = $includeCatalog ? $pdo->query(
            <<<'SQL'
            SELECT LOWER(event.normalized_email) AS email,
                   MAX(NULLIF(timer.name, '')) AS display_name
              FROM firebase_legacy_import_events event
              JOIN timer_sessions timer ON timer.id = event.timer_session_id
             WHERE event.account_group = 'KTV'
               AND event.resolution_status = 'imported'
               AND NULLIF(event.normalized_email, '') IS NOT NULL
               AND NOT COALESCE(timer.is_mock, FALSE)
               AND NOT EXISTS (
                   SELECT 1
                     FROM v_ktv_directory directory
                    WHERE directory.is_terminated = FALSE
                      AND LOWER(directory.email) = LOWER(event.normalized_email)
               )
             GROUP BY LOWER(event.normalized_email)
             ORDER BY LOWER(event.normalized_email)
            SQL
        )->fetchAll() : [];
        foreach ($firebaseFtcRows as $firebaseFtcRow) {
            $technicianRows[] = [
                'user_id' => null,
                'employee_id' => null,
                'email' => (string)$firebaseFtcRow['email'],
                'display_name' => (string)($firebaseFtcRow['display_name'] ?: $firebaseFtcRow['email']),
                'role' => 'KTV',
                'job_title' => 'KTV lịch sử chưa đối chiếu khu vực',
                'unit_code' => 'FTC',
                'unit_name' => 'FTC',
                'region_id' => null,
                'region_code' => 'FTC',
                'region_name' => 'FTC',
                'dashboard_region' => 'FTC',
                'dashboard_group' => 'FTC',
                'branch_name' => 'FTC',
                'location_assigned' => false,
                'is_terminated' => false,
                'class_code' => null,
                'active_class_code' => null,
                'active_class_name' => null,
            ];
        }

    } catch (Throwable $e) {
        report_exception($e, 'dashboard-core-queries');
        fail(500, 'dashboard-query-failed', 'Unable to load dashboard data.');
    }
    foreach ($technicianRows as &$technicianRow) {
        $technicianRow['source_class_code'] = $technicianRow['class_code'] ?? null;
        $technicianRow['class_code'] = $technicianRow['active_class_code']
            ?? $technicianRow['class_code']
            ?? null;
        $technicianRow['class_name'] = $technicianRow['active_class_name']
            ?? $technicianRow['class_code']
            ?? 'Chưa xếp lớp';
    }
    unset($technicianRow);

    $sessions = [];
    $deviceMap = [];
    $deviceById = [];
    $labMap = [];
    try {
        $catalogRows = ($includeCatalog ?? false) ? $pdo
            ->query(
                'SELECT d.device_id, d.model, d.device_name, d.sort_order AS device_sort_order,
                        l.lab_id, l.lab_name, l.sort_order AS lab_sort_order
                 FROM device_catalog d
                 LEFT JOIN lab_catalog l ON l.device_id = d.device_id AND l.is_active = TRUE
                 WHERE d.is_active = TRUE
                 ORDER BY d.sort_order, d.device_name, d.device_id,
                          l.sort_order, l.lab_name, l.lab_id'
            )
            ->fetchAll() : [];
        foreach ($catalogRows as $row) {
            $deviceName = (string)($row['device_name'] ?? '');
            if ($deviceName !== '' && !isset($deviceMap[$deviceName])) {
                $device = [
                    'device_id' => (string)($row['device_id'] ?? ('DEV_' . count($deviceMap))),
                    'model' => (string)($row['model'] ?? ''),
                    'device_name' => $deviceName,
                ];
                $deviceMap[$deviceName] = $device;
                if ($device['device_id'] !== '') {
                    $deviceById[$device['device_id']] = $device;
                }
            }
            $labId = (string)($row['lab_id'] ?? '');
            if ($labId !== '' && !isset($labMap[$labId])) {
                $labMap[$labId] = [
                    'lab_id' => $labId,
                    'lab_name' => (string)($row['lab_name'] ?? $labId),
                    'device_id' => (string)($row['device_id'] ?? ''),
                ];
            }
        }
    } catch (Throwable $ignored) {
        // Bang danh muc chua duoc tao (chua chay migration 008) -> chi dung du lieu tu sessions.
    }

    foreach ($rows as $row) {
        $roster = $resolveRoster($row);
        $labKey = (string)($row['lab_id'] ?? '');
        $catalogDeviceId = (string)($labMap[$labKey]['device_id'] ?? '');
        $device = (string)($deviceById[$catalogDeviceId]['device_name'] ?? ($row['device_name'] ?? ''));
        $decodedClassCodes = json_decode((string)($row['assignment_class_codes'] ?? '[]'), true);
        $assignmentClassCodes = array_values(array_filter(
            is_array($decodedClassCodes) ? $decodedClassCodes : [],
            static fn(mixed $value): bool => is_string($value) && $value !== ''
        ));
        $sessions[] = [
            'session_id' => (string)$row['session_id'],
            'technician_id' => (string)($roster['employee_id'] ?? ($row['technician_id'] ?? '')),
            'full_name' => (string)($roster['display_name'] ?? ($row['name'] ?? '')),
            'email' => (string)($roster['email'] ?? ($row['email'] ?? '')),
            'started_at' => safe_datetime($row['started_at']),
            'duration_sec' => $row['duration_sec'] !== null ? (int)$row['duration_sec'] : null,
            'mode' => (string)($row['mode'] ?? 'Thực hành'),
            'device_id' => (string)($row['device_id'] ?? ''),
            'device_name' => $device,
            'lab_id' => $labKey,
            'lab_name' => isset($labMap[$labKey]) ? $labMap[$labKey]['lab_name'] : (string)($row['lab_name'] ?? ''),
            'is_passed' => isset($row['is_passed']) ? (bool)$row['is_passed'] : null,
            'status' => (string)($row['status'] ?? ((isset($row['is_passed']) && $row['is_passed'] === false) ? 'failed' : 'completed')),
            'completed_first_try' => database_nullable_boolean($row['completed_first_try'] ?? null),
            'practice_attempt_no' => $row['practice_attempt_no'] !== null ? (int)$row['practice_attempt_no'] : null,
            'attempt_sequence_complete' => database_boolean($row['attempt_sequence_complete'] ?? true),
            'seed_batch' => (string)($row['seed_batch'] ?? ''),
            'last_action' => (string)($row['last_action'] ?? ''),
            'assignment_class_codes' => $assignmentClassCodes,
        ];

    }

    $assignments = [];
    $classMemberships = [];
    $assignmentsAvailable = true;
    $includeAssignments = array_key_exists('include_assignments', $_GET)
        && filter_var($_GET['include_assignments'], FILTER_VALIDATE_BOOLEAN);
    if ($includeAssignments) {
        try {
            $membershipRows = $pdo->query(
                <<<'SQL'
                SELECT training.class_code, training.class_name, roster.email
                  FROM class_enrollments enrollment
                  JOIN training_classes training ON training.class_id = enrollment.class_id
                  JOIN users roster ON roster.user_id = enrollment.user_id
                 WHERE enrollment.status = 'active'
                   AND training.is_mock = FALSE
                   AND roster.is_terminated = FALSE
                 ORDER BY training.class_code, roster.email
                SQL
            )->fetchAll();
            foreach ($membershipRows as $row) {
                $classMemberships[] = [
                    'class_code' => (string)$row['class_code'],
                    'class_name' => (string)($row['class_name'] ?? ''),
                    'email' => strtolower(trim((string)($row['email'] ?? ''))),
                ];
            }
            $assignmentStatement = $pdo->prepare(
                <<<'SQL'
                SELECT progress.email,
                       progress.class_code,
                       progress.class_name,
                       progress.device_name,
                       progress.lab_name,
                       CASE WHEN evidence.has_completion_pass
                            THEN 'passed' ELSE progress.assignment_status END AS status,
                       COALESCE(evidence.passed_at, progress.completed_at) AS completed_at,
                       evidence.first_pass_attempt_no,
                       COALESCE(evidence.historical_pass_count, 0) AS historical_pass_count,
                       COALESCE(evidence.recorded_practice_count, 0) AS recorded_practice_count,
                       COALESCE(evidence.lifetime_pass_count, 0) AS lifetime_pass_count,
                       COALESCE(evidence.lifetime_attempt_count, 0) AS lifetime_attempt_count,
                       COALESCE(evidence.lifetime_historical_pass_count, 0) AS lifetime_historical_pass_count
                  FROM v_lab_assignment_progress progress
                  JOIN users roster ON roster.user_id = progress.user_id
                   JOIN training_classes training ON training.class_id = progress.class_id
                   JOIN lab_assignments assignment ON assignment.assignment_id = progress.assignment_id
                   JOIN class_enrollments enrollment ON enrollment.enrollment_id = assignment.enrollment_id
                  LEFT JOIN class_lab_assignments class_assignment
                    ON class_assignment.class_lab_assignment_id = assignment.class_lab_assignment_id
                  LEFT JOIN LATERAL (
                      SELECT BOOL_OR(
                                 session.is_passed IS TRUE
                                 AND (
                                     session.attempt_sequence_complete IS TRUE
                                     OR (
                                         session.attempt_sequence_complete IS FALSE
                                         AND session.seed_batch LIKE 'firebase-v1-%'
                                     )
                                 )
                             ) AS has_completion_pass,
                             MIN(session.practice_attempt_no) FILTER (
                                 WHERE session.is_passed IS TRUE
                                   AND session.attempt_sequence_complete IS TRUE
                             ) AS first_pass_attempt_no,
                             MIN(COALESCE(session.finished_at, session.started_at, session.created_at)) FILTER (
                                 WHERE session.is_passed IS TRUE
                                   AND (
                                       session.attempt_sequence_complete IS TRUE
                                       OR (
                                           session.attempt_sequence_complete IS FALSE
                                           AND session.seed_batch LIKE 'firebase-v1-%'
                                       )
                                   )
                             ) AS passed_at,
                             COUNT(*) FILTER (
                                 WHERE session.is_passed IS TRUE
                                   AND session.attempt_sequence_complete IS FALSE
                                   AND session.seed_batch LIKE 'firebase-v1-%'
                             ) AS historical_pass_count,
                             COUNT(*) FILTER (
                                 WHERE (
                                     session.is_passed IS NOT NULL
                                     AND session.attempt_sequence_complete IS TRUE
                                 )
                                 OR (
                                     session.is_passed IS TRUE
                                     AND session.attempt_sequence_complete IS FALSE
                                     AND session.seed_batch LIKE 'firebase-v1-%'
                                 )
                             ) AS recorded_practice_count,
                             COUNT(*) FILTER (
                                 WHERE session.is_passed IS TRUE
                                   AND session.attempt_sequence_complete IS TRUE
                                   AND assignment_link.timer_session_id IS NOT NULL
                             ) AS lifetime_pass_count,
                             COUNT(*) FILTER (
                                 WHERE session.is_passed IS NOT NULL
                                   AND session.attempt_sequence_complete IS TRUE
                                   AND assignment_link.timer_session_id IS NOT NULL
                             ) AS lifetime_attempt_count,
                             COUNT(*) FILTER (
                                 WHERE session.is_passed IS TRUE
                                   AND session.attempt_sequence_complete IS FALSE
                                   AND session.seed_batch LIKE 'firebase-v1-%'
                                   AND assignment_link.timer_session_id IS NOT NULL
                             ) AS lifetime_historical_pass_count
                        FROM timer_sessions session
                        LEFT JOIN timer_session_assignment_links assignment_link
                          ON assignment_link.timer_session_id = session.id
                         AND assignment_link.assignment_id = progress.assignment_id
                       WHERE session.lab_id = progress.lab_id
                         AND (
                             session.user_id = progress.user_id
                             OR (session.user_id IS NULL AND NULLIF(progress.email, '') IS NOT NULL AND LOWER(session.email) = LOWER(progress.email))
                             OR (session.user_id IS NULL AND NULLIF(session.email, '') IS NULL AND NULLIF(progress.employee_code, '') IS NOT NULL AND session.technician_id = progress.employee_code)
                         )
                         AND session.mode IN ('Thực hành', 'practice')
                         AND session.status IN ('completed', 'failed')
                         AND NOT COALESCE(session.is_mock, FALSE)
                         AND COALESCE(session.started_at, session.finished_at, session.created_at) >= progress.assigned_at
                  ) evidence ON TRUE
                  WHERE roster.is_terminated = FALSE
                    AND enrollment.status = 'active'
                   AND training.is_mock = FALSE
                   AND progress.assignment_status <> 'waived'
                   AND (
                       class_assignment.class_lab_assignment_id IS NULL
                       OR class_assignment.status IN ('assigned', 'active')
                   )
                 ORDER BY progress.class_code, progress.email,
                          progress.device_name, progress.lab_name
                SQL
            );
            $assignmentStatement->execute();
            $assignmentRows = $assignmentStatement->fetchAll();
            foreach ($assignmentRows as $row) {
                $assignments[] = [
                    'email' => (string)($row['email'] ?? ''),
                    'class_code' => (string)$row['class_code'],
                    'class_name' => (string)($row['class_name'] ?? ''),
                    'device_name' => (string)$row['device_name'],
                    'lab_name' => (string)$row['lab_name'],
                    'status' => (string)$row['status'],
                    'completed_at' => safe_datetime($row['completed_at']),
                    'first_pass_attempt_no' => $row['first_pass_attempt_no'] !== null
                        ? (int)$row['first_pass_attempt_no']
                        : null,
                    'historical_pass_count' => (int)($row['historical_pass_count'] ?? 0),
                    'recorded_practice_count' => (int)($row['recorded_practice_count'] ?? 0),
                    // Compact cumulative [passed, graded attempts, historical passes] for this assignment.
                    'lifetime_counts' => [
                        (int)($row['lifetime_pass_count'] ?? 0),
                        (int)($row['lifetime_attempt_count'] ?? 0),
                        (int)($row['lifetime_historical_pass_count'] ?? 0),
                    ],
                ];
            }
        } catch (Throwable $e) {
            $assignmentsAvailable = false;
            report_exception($e, 'dashboard-assignments');
        }
    }

    $dashboardTechnicians = array_map(static fn(array $row): array => [
        'user_id' => (string)$row['user_id'],
        'email' => (string)($row['email'] ?? ''),
        'display_name' => $row['display_name'] ?? null,
        'employee_id' => $row['employee_id'] ?? null,
        'job_title' => $row['job_title'] ?? null,
        'class_code' => $row['class_code'] ?? null,
        'class_name' => $row['class_name'] ?? null,
        'unit_code' => $row['unit_code'] ?? null,
        'unit_name' => $row['unit_name'] ?? null,
        'unit_id' => $row['unit_id'] ?? null,
        'region_id' => $row['region_id'] ?? null,
        'region_code' => $row['region_code'] ?? null,
        'region_name' => $row['region_name'] ?? null,
        'dashboard_region' => $row['dashboard_region'] ?? null,
        'dashboard_group' => $row['dashboard_group'] ?? null,
        'branch_name' => $row['branch_name'] ?? null,
        'location_assigned' => database_boolean($row['location_assigned'] ?? false),
        'is_terminated' => database_boolean($row['is_terminated'] ?? false),
        'updated_at' => $row['updated_at'] ?? null,
    ], $technicianRows);

    respond(['data' => [
        'sessions' => $sessions,
        'devices' => array_values($deviceMap),
        'labs' => array_values($labMap),
        'technicians' => $dashboardTechnicians,
        'assignments' => $assignments,
        'class_memberships' => $classMemberships,
        'assignments_available' => $includeAssignments ? $assignmentsAvailable : null,
        'session_page' => [
            'from' => $dateFrom,
            'to' => $dateTo,
            'limit' => $sessionLimit,
            'has_more' => $hasMoreSessions,
            'next_cursor' => $nextSessionCursor,
        ],
    ]]);
}

function handle_system(array $segments, string $method): void
{
    require_admin();
    $action = $segments[1] ?? '';

    if ($action === 'usage') {
        if ($method !== 'GET') {
            fail(405, 'method-not-allowed', 'Usage endpoint only supports GET.');
        }
        $pdo = db();
        try {
            $dbSizeBytes = (int)$pdo->query('SELECT pg_database_size(current_database())')->fetchColumn();
            $dbSizeMb = round($dbSizeBytes / 1024 / 1024, 2);

            $tableSizes = $pdo->query(<<<'SQL'
                SELECT schemaname || '.' || tablename AS table_name,
                       pg_total_relation_size(schemaname || '.' || tablename) AS size_bytes,
                       pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size_pretty
                  FROM pg_tables
                 WHERE schemaname = 'public'
                 ORDER BY size_bytes DESC
                 LIMIT 10
            SQL)->fetchAll(PDO::FETCH_ASSOC);

            $phpSessions = ['active' => 0, 'expired' => 0, 'total' => 0];
            $djangoSessions = ['active' => 0, 'expired' => 0, 'total' => 0];
            try {
                $row = $pdo->query(<<<'SQL'
                    SELECT COUNT(*) FILTER (WHERE expires_at > NOW())::bigint AS active,
                           COUNT(*) FILTER (WHERE expires_at <= NOW())::bigint AS expired,
                           COUNT(*)::bigint AS total
                      FROM app_sessions
                SQL)->fetch(PDO::FETCH_ASSOC) ?: [];
                $phpSessions = [
                    'active' => (int)($row['active'] ?? 0),
                    'expired' => (int)($row['expired'] ?? 0),
                    'total' => (int)($row['total'] ?? 0),
                ];
            } catch (Throwable) {}
            try {
                $row = $pdo->query(<<<'SQL'
                    SELECT COUNT(*) FILTER (WHERE expire_date > NOW())::bigint AS active,
                           COUNT(*) FILTER (WHERE expire_date <= NOW())::bigint AS expired,
                           COUNT(*)::bigint AS total
                      FROM django_session
                SQL)->fetch(PDO::FETCH_ASSOC) ?: [];
                $djangoSessions = [
                    'active' => (int)($row['active'] ?? 0),
                    'expired' => (int)($row['expired'] ?? 0),
                    'total' => (int)($row['total'] ?? 0),
                ];
            } catch (Throwable) {}

            $connectionCount = 0;
            $connectionLimit = 0;
            try {
                $connectionCount = (int)$pdo->query(
                    'SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()'
                )->fetchColumn();
                // This is the live PostgreSQL backend limit reported by the
                // active Neon compute, not a guessed pooler or plan quota.
                $connectionLimit = (int)$pdo->query('SHOW max_connections')->fetchColumn();
            } catch (Throwable) {}
            $connectionPercent = system_usage_percent($connectionCount, $connectionLimit);

            $activeTier = get_active_database_tier();
            $standbyConfigured = $activeTier === 'fallback'
                ? (bool)env_value('DATABASE_URL')
                : (bool)env_value('FALLBACK_DATABASE_URL');

            $neonMetrics = neon_usage_metrics();

            // The current logical DB size comes from PostgreSQL. Its limit,
            // when Neon exposes one, comes exclusively from the project API.
            $storageLimitBytes = isset($neonMetrics['storageLimitBytes'])
                && is_numeric($neonMetrics['storageLimitBytes'])
                && (float)$neonMetrics['storageLimitBytes'] > 0
                    ? (float)$neonMetrics['storageLimitBytes']
                    : null;
            $storageLimitMb = $storageLimitBytes === null
                ? null
                : round($storageLimitBytes / 1024 / 1024, 2);
            $usagePct = $storageLimitMb === null
                ? null
                : system_usage_percent($dbSizeMb, $storageLimitMb);
            $status = $usagePct === null ? 'UNKNOWN' : system_usage_status($usagePct);
            $storageSource = 'postgres_logical_database_size';
            $storageLimitSource = $storageLimitMb !== null
                ? 'neon_project_api'
                : (empty($neonMetrics['configured'])
                    ? 'not_configured'
                    : (empty($neonMetrics['available']) ? 'api_error' : 'not_exposed'));

            // Compute usage and quota both come from GET /projects/{id}.
            $computeLimit = isset($neonMetrics['computeLimitHours'])
                && is_numeric($neonMetrics['computeLimitHours'])
                    ? (float)$neonMetrics['computeLimitHours']
                    : null;
            $computeUsed = null;
            $computeSource = 'neon_project_api';
            $computeNote = 'Neon API chưa cung cấp số liệu cho project này.';
            if (!empty($neonMetrics['available']) && isset($neonMetrics['computeHours'])) {
                $computeUsed = (float)$neonMetrics['computeHours'];
                $computeNote = $computeLimit === null
                    ? 'Usage tự động từ Neon API; project không công bố quota qua API.'
                    : 'Usage và quota tự động từ Neon Project API.';
            } elseif (!empty($neonMetrics['configured'])) {
                $httpStatus = (int)($neonMetrics['httpStatus'] ?? 0);
                $computeNote = $httpStatus > 0
                    ? 'Neon API chưa lấy được số liệu (HTTP ' . $httpStatus . ').'
                    : 'Neon API chưa xác định được project đang sử dụng.';
            }

            respond([
                'data' => [
                    'activeTier' => $activeTier,
                    'selectionMode' => 'controlled',
                    'standbyConfigured' => $standbyConfigured,
                    'isRender' => (bool)(env_value('RENDER') === 'true' || env_value('IS_RENDER') === 'true'),
                    'renderSelfPingEnabled' => env_bool('RENDER_SELF_PING_ENABLED', false),
                    'storage' => [
                        'databaseSizeBytes' => $dbSizeBytes,
                        'databaseSizeMb' => $dbSizeMb,
                        'neonLimitMb' => $storageLimitMb,
                        'usagePercent' => $usagePct,
                        'status' => $status,
                        'measurement' => $storageSource,
                        'source' => $storageSource,
                        'isEstimate' => false,
                        'neonActualMb' => null,
                        'limitSource' => $storageLimitSource,
                    ],
                    'database' => [
                        'connections' => [
                            'current' => $connectionCount,
                            'limit' => $connectionLimit,
                            'usagePercent' => $connectionPercent,
                            'status' => $connectionPercent === null ? 'UNKNOWN' : system_usage_status($connectionPercent),
                        ],
                        'networkTransfer' => [
                            'available' => !empty($neonMetrics['available']) && isset($neonMetrics['dataTransferBytes']),
                            'bytes' => (int)($neonMetrics['dataTransferBytes'] ?? 0),
                            'mb' => isset($neonMetrics['dataTransferBytes']) ? round((float)$neonMetrics['dataTransferBytes'] / (1024 * 1024), 2) : 0.0,
                            'source' => !empty($neonMetrics['available']) ? 'neon_project_api' : 'not_exposed_by_postgresql',
                            'writtenDataBytes' => (int)($neonMetrics['writtenDataBytes'] ?? 0),
                        ],
                    ],
                    'computeHours' => [
                        'limit' => $computeLimit,
                        'used' => $computeUsed,
                        'configured' => !empty($neonMetrics['configured']),
                        'source' => $computeSource,
                        'note' => $computeNote,
                    ],
                    'neon' => $neonMetrics,
                    'render' => render_usage_metrics(),
                    'tables' => $tableSizes,
                    'sessions' => [
                        'phpSessions' => $phpSessions['active'],
                        'djangoSessions' => $djangoSessions['active'],
                        'php' => $phpSessions,
                        'django' => $djangoSessions,
                    ],
                    'checkedAt' => gmdate('c'),
                ],
            ]);
        } catch (Throwable $exception) {
            report_exception($exception, 'system-usage');
            fail(500, 'system-usage-failed', 'Unable to retrieve system usage data.');
        }
    }

    if ($action === 'cleanup') {
        if ($method !== 'POST') {
            fail(405, 'method-not-allowed', 'Cleanup endpoint only supports POST.');
        }
        $pdo = db();
        try {
            $hasFunction = (bool)$pdo->query("SELECT 1 FROM pg_proc WHERE proname = 'cleanup_expired_sessions'")->fetchColumn();
            if ($hasFunction) {
                $result = $pdo->query('SELECT * FROM cleanup_expired_sessions()')->fetch(PDO::FETCH_ASSOC);
                respond(['data' => ['success' => true, 'result' => $result]]);
            } else {
                $deletedPhp = $pdo->exec('DELETE FROM app_sessions WHERE expires_at < NOW()');
                $deletedDjango = 0;
                try {
                    $deletedDjango = $pdo->exec('DELETE FROM django_session WHERE expire_date < NOW()');
                } catch (Throwable) {}
                respond([
                    'data' => [
                        'success' => true,
                        'phpSessionsDeleted' => $deletedPhp,
                        'djangoSessionsDeleted' => $deletedDjango,
                    ],
                ]);
            }
        } catch (Throwable $exception) {
            report_exception($exception, 'system-cleanup');
            fail(500, 'system-cleanup-failed', 'Unable to run database cleanup.');
        }
    }

    fail(404, 'not-found', 'System endpoint not found.');
}

function respond_private_cache(array $payload, int $maxAge = 21600): void
{
    header_remove('Cache-Control');
    header('Cache-Control: private, max-age=' . $maxAge . ', stale-while-revalidate=86400');
    header('Vary: Cookie', false);
    respond($payload);
}

try {
    if ($resource === 'auth') {
        handle_auth($segments, $method);
    } elseif ($resource === 'iam') {
        handle_iam($segments, $method);
    } elseif ($resource === 'users') {
        handle_users($segments, $method);
    } elseif ($resource === 'roles') {
        handle_roles($segments, $method);
    } elseif ($resource === 'login_logs') {
        handle_login_logs($segments, $method);
    } elseif ($resource === 'tracking') {
        handle_tracking($segments, $method);
    } elseif ($resource === 'dev') {
        handle_dev($segments, $method);
    } elseif ($resource === 'roster') {
        handle_roster($segments, $method);
    } elseif ($resource === 'classes') {
        handle_training_classes($segments, $method);
    } elseif ($resource === 'learning') {
        handle_learning($segments, $method);
    } elseif ($resource === 'reports') {
        handle_reports($segments, $method);
    } elseif ($resource === 'dashboard') {
        handle_dashboard($segments, $method);
    } elseif ($resource === 'system') {
        handle_system($segments, $method);
    } elseif ($resource === 'health') {
        handle_health($method);
    } elseif (is_root_iam_callback($resource, $method)) {
        process_iam_callback();
    } elseif ($resource === '') {
        respond([
            'ok' => true,
            'service' => 'postgres-api',
            'version' => substr((string)env_value('RENDER_GIT_COMMIT', env_value('APP_VERSION', 'development')), 0, 12),
        ]);
    }
    fail(404, 'not-found', 'Endpoint not found.');
} catch (Throwable $exception) {
    report_exception($exception, 'request');
    fail(500, 'server-error', 'An internal server error occurred.');
}

