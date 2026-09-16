<?php
declare(strict_types=1);

const KTV_ROSTER_IMPORT_SOURCE = 'ktv_roster_import';

const KTV_ROSTER_REQUIRED_HEADERS = [
    'Empl ID' => 'employee_id',
    'Name' => 'display_name',
    'Email' => 'email',
    'Job Title (VN)' => 'job_title',
    'Branch' => 'branch',
    'Parent Department' => 'parent_department',
    'Child Department 1' => 'child_department_1',
    'Child Department 2' => 'child_department_2',
    'Ghi chú xếp lớp' => 'class_code',
];

const KTV_ROSTER_TERMINATION_REQUIRED_HEADERS = [
    'Empl ID' => 'employee_id',
    'Name' => 'display_name',
    'Email' => 'email',
];

const KTV_ROSTER_SPREADSHEET_NAMESPACE = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const KTV_ROSTER_RELATIONSHIPS_NAMESPACE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

const KTV_ROSTER_DASHBOARD_REGIONS = [
    'PNCDNB' => 'DNB',
    'PNCHCM' => 'HCM',
    'PNCTDDT' => 'TDDT - PNC',
    'PNCTNB' => 'TNB',
    'PNCTNMT' => 'TNMT - PNC',
    'TINDBB' => 'DBB',
    'TINHNI' => 'HNI',
    'TINTBB' => 'TBB',
    'TINTDDT' => 'TDDT - TIN',
    'TINTNMT' => 'TNMT - TIN',
];

function ktv_roster_column_index(string $reference): int
{
    if (!preg_match('/^([A-Z]+)/i', $reference, $matches)) {
        throw new RuntimeException('Invalid XLSX cell reference: ' . $reference);
    }
    $index = 0;
    foreach (str_split(strtoupper($matches[1])) as $character) {
        $index = ($index * 26) + (ord($character) - 64);
    }
    return $index - 1;
}

function ktv_roster_xml_document(string $contents, string $description): DOMDocument
{
    $previousInternalErrors = libxml_use_internal_errors(true);
    libxml_clear_errors();
    try {
        $document = new DOMDocument();
        if (!$document->loadXML($contents, LIBXML_NONET | LIBXML_COMPACT)) {
            throw new RuntimeException("Unable to parse $description.");
        }
        return $document;
    } finally {
        libxml_clear_errors();
        libxml_use_internal_errors($previousInternalErrors);
    }
}

function ktv_roster_relationships(ZipArchive $zip, string $path): array
{
    $contents = $zip->getFromName($path);
    if ($contents === false) {
        throw new RuntimeException("XLSX relationship file is missing: $path");
    }
    $document = ktv_roster_xml_document($contents, "XLSX relationship file: $path");
    $xpath = new DOMXPath($document);
    $relationships = $xpath->query(
        '/*[local-name()="Relationships"]/*[local-name()="Relationship"]'
    );
    if ($relationships === false) {
        throw new RuntimeException("Unable to read XLSX relationship file: $path");
    }
    $map = [];
    foreach ($relationships as $relationship) {
        if (!$relationship instanceof DOMElement) {
            continue;
        }
        $relationshipId = trim($relationship->getAttribute('Id'));
        $target = trim($relationship->getAttribute('Target'));
        if ($relationshipId !== '' && $target !== '') {
            $map[$relationshipId] = $target;
        }
    }
    return $map;
}

function ktv_roster_shared_strings(ZipArchive $zip): array
{
    $contents = $zip->getFromName('xl/sharedStrings.xml');
    if ($contents === false) {
        return [];
    }
    $reader = new XMLReader();
    if (!$reader->XML($contents, null, LIBXML_NONET | LIBXML_COMPACT)) {
        throw new RuntimeException('Unable to parse XLSX shared strings.');
    }
    $strings = [];
    while ($reader->read()) {
        if ($reader->nodeType !== XMLReader::ELEMENT || $reader->localName !== 'si') {
            continue;
        }
        $node = $reader->expand();
        if (!$node) {
            continue;
        }
        $text = '';
        foreach ($node->getElementsByTagName('t') as $part) {
            $text .= $part->textContent;
        }
        $strings[] = $text;
    }
    $reader->close();
    return $strings;
}

function ktv_roster_sheet_target_path(string $target): string
{
    $target = str_replace('\\', '/', trim($target));
    if (str_starts_with($target, '/')) {
        return ltrim($target, '/');
    }
    while (str_starts_with($target, '../')) {
        $target = substr($target, 3);
    }
    return str_starts_with($target, 'xl/') ? $target : 'xl/' . $target;
}

function ktv_roster_workbook_sheets(ZipArchive $zip): array
{
    $workbookXml = $zip->getFromName('xl/workbook.xml');
    if ($workbookXml === false) {
        throw new RuntimeException('The XLSX workbook descriptor is missing.');
    }
    $document = ktv_roster_xml_document($workbookXml, 'the XLSX workbook descriptor');
    $xpath = new DOMXPath($document);
    $sheetNodes = $xpath->query(
        '/*[local-name()="workbook"]/*[local-name()="sheets"]/*[local-name()="sheet"]'
    );
    if ($sheetNodes === false || $sheetNodes->length < 1) {
        throw new RuntimeException('The XLSX workbook does not contain a worksheet.');
    }
    $relationships = ktv_roster_relationships($zip, 'xl/_rels/workbook.xml.rels');

    $sheets = [];
    foreach ($sheetNodes as $sheetNode) {
        if (!$sheetNode instanceof DOMElement) {
            continue;
        }
        $relationshipId = trim($sheetNode->getAttributeNS(KTV_ROSTER_RELATIONSHIPS_NAMESPACE, 'id'));
        if ($relationshipId === '') {
            foreach ($sheetNode->attributes as $attribute) {
                if ($attribute->localName === 'id' && $attribute->namespaceURI !== null) {
                    $relationshipId = trim($attribute->value);
                    break;
                }
            }
        }
        $target = $relationships[$relationshipId] ?? null;
        if (!is_string($target) || trim($target) === '') {
            throw new RuntimeException('Unable to resolve XLSX worksheet: ' . $sheetNode->getAttribute('name'));
        }
        $sheets[] = [
            'name' => trim($sheetNode->getAttribute('name')),
            'path' => ktv_roster_sheet_target_path($target),
            'relationship_id' => $relationshipId,
        ];
    }
    if (!$sheets) {
        throw new RuntimeException('The XLSX workbook does not contain a resolvable worksheet.');
    }
    return $sheets;
}

function ktv_roster_first_sheet_path(ZipArchive $zip): string
{
    $sheets = ktv_roster_workbook_sheets($zip);
    return (string)$sheets[0]['path'];
}

function ktv_roster_uses_1904_dates(ZipArchive $zip): bool
{
    $contents = $zip->getFromName('xl/workbook.xml');
    if ($contents === false) {
        throw new RuntimeException('The XLSX workbook descriptor is missing.');
    }
    $document = ktv_roster_xml_document($contents, 'the XLSX workbook descriptor');
    $xpath = new DOMXPath($document);
    $properties = $xpath->query(
        '/*[local-name()="workbook"]/*[local-name()="workbookPr"][1]'
    );
    if ($properties === false || $properties->length === 0) {
        return false;
    }
    $node = $properties->item(0);
    $value = $node instanceof DOMElement
        ? strtolower(trim($node->getAttribute('date1904')))
        : '0';
    return in_array($value, ['1', 'true'], true);
}

function ktv_roster_cell_value(DOMElement $cell, array $sharedStrings): string
{
    $type = $cell->getAttribute('t');
    if ($type === 'inlineStr') {
        $value = '';
        foreach ($cell->getElementsByTagName('t') as $part) {
            $value .= $part->textContent;
        }
        return $value;
    }
    $valueNodes = $cell->getElementsByTagName('v');
    $raw = $valueNodes->length ? $valueNodes->item(0)->textContent : '';
    if ($type === 's') {
        return $sharedStrings[(int)$raw] ?? '';
    }
    if ($type === 'b') {
        return $raw === '1' ? 'TRUE' : 'FALSE';
    }
    return $raw;
}

function ktv_roster_nullable_text(mixed $value, int $maximumLength = 500): ?string
{
    $text = trim((string)$value);
    if ($text === '') {
        return null;
    }
    $length = function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
    if ($length > $maximumLength) {
        throw new RuntimeException('Text value exceeds the maximum length.');
    }
    return $text;
}

function ktv_roster_excel_date(mixed $value, bool $uses1904Dates = false): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (is_numeric($value)) {
        $serial = (float)$value;
        if ($serial <= 0) {
            return null;
        }
        $days = (int)floor($serial);
        $epoch = $uses1904Dates ? '1904-01-01' : '1899-12-30';
        return (new DateTimeImmutable($epoch, new DateTimeZone('UTC')))
            ->modify("+$days days")
            ->format('Y-m-d');
    }

    $text = trim((string)$value);
    if ($text === '') {
        return null;
    }
    $formats = [
        ['!Y-m-d', 'Y-m-d'],
        ['!d/m/Y', 'd/m/Y'],
        ['!d-m-Y', 'd-m-Y'],
        ['!d/m/y', 'd/m/y'],
        ['!d-m-y', 'd-m-y'],
        ['!Y-m-d H:i:s', 'Y-m-d H:i:s'],
        ['!d/m/Y H:i:s', 'd/m/Y H:i:s'],
    ];
    foreach ($formats as [$format, $comparisonFormat]) {
        $date = DateTimeImmutable::createFromFormat($format, $text, new DateTimeZone('UTC'));
        $errors = DateTimeImmutable::getLastErrors();
        $valid = $errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0);
        if ($date && $valid && $date->format($comparisonFormat) === $text) {
            return $date->format('Y-m-d');
        }
    }

    throw new RuntimeException('Invalid date value: ' . $text);
}

function ktv_roster_normalize_row(array $row, int $rowNumber, bool $uses1904Dates = false): array
{
    $employeeId = trim((string)($row['employee_id'] ?? ''));
    $email = strtolower(trim((string)($row['email'] ?? '')));
    $displayName = trim((string)($row['display_name'] ?? ''));
    $sourceRegion = strtoupper(trim((string)($row['parent_department'] ?? '')));

    if (!preg_match('/^\d{8}$/', $employeeId)) {
        throw new RuntimeException("Row $rowNumber has invalid Empl ID; expected exactly 8 digits.");
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException("Row $rowNumber has invalid Email.");
    }
    if ($displayName === '') {
        throw new RuntimeException("Row $rowNumber has empty Name.");
    }
    if (!isset(KTV_ROSTER_DASHBOARD_REGIONS[$sourceRegion])) {
        throw new RuntimeException("Row $rowNumber has unsupported Parent Department: $sourceRegion.");
    }

    $childDepartment2 = ktv_roster_nullable_text($row['child_department_2'] ?? null, 100);
    $childDepartment1 = ktv_roster_nullable_text($row['child_department_1'] ?? null, 100);
    $unitCode = $childDepartment2 ?: $childDepartment1;

    return [
        'employee_id' => $employeeId,
        'display_name' => $displayName,
        'email' => $email,
        'job_title' => ktv_roster_nullable_text($row['job_title'] ?? null),
        'branch' => ktv_roster_nullable_text($row['branch'] ?? null, 100),
        'parent_department' => $sourceRegion,
        'child_department_1' => $childDepartment1,
        'child_department_2' => $childDepartment2,
        'class_code' => ktv_roster_nullable_text($row['class_code'] ?? null, 50),
        'unit_code' => $unitCode,
        'unit_name' => $unitCode,
        'region_code' => $sourceRegion,
        'dashboard_region' => KTV_ROSTER_DASHBOARD_REGIONS[$sourceRegion],
        'source_row' => $rowNumber,
    ];
}

function ktv_roster_normalize_termination_row(
    array $row,
    int $rowNumber,
    bool $uses1904Dates = false
): array {
    $employeeId = trim((string)($row['employee_id'] ?? ''));
    $email = strtolower(trim((string)($row['email'] ?? '')));
    $displayName = trim((string)($row['display_name'] ?? ''));

    if (!preg_match('/^\d{8}$/', $employeeId)) {
        throw new RuntimeException("Row $rowNumber has invalid Empl ID; expected exactly 8 digits.");
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new RuntimeException("Row $rowNumber has invalid Email.");
    }

    return [
        'employee_id' => $employeeId,
        'display_name' => $displayName !== '' ? $displayName : null,
        'email' => $email !== '' ? $email : null,
        'source_row' => $rowNumber,
    ];
}

function ktv_roster_sheet_name_key(string $name): string
{
    $name = preg_replace('/\s+/u', ' ', trim($name)) ?? trim($name);
    return function_exists('mb_strtolower')
        ? mb_strtolower($name, 'UTF-8')
        : strtolower($name);
}

function ktv_roster_parse_worksheet(
    ZipArchive $zip,
    array $sheet,
    array $sharedStrings,
    bool $uses1904Dates,
    array $requiredHeaders,
    callable $normalizer
): array {
    $sheetName = trim((string)($sheet['name'] ?? ''));
    $sheetPath = (string)($sheet['path'] ?? '');
    $sheetXml = $zip->getFromName($sheetPath);
    if ($sheetXml === false) {
        throw new RuntimeException('The XLSX worksheet is missing: ' . $sheetPath);
    }

    $reader = new XMLReader();
    if (!$reader->XML($sheetXml, null, LIBXML_NONET | LIBXML_COMPACT)) {
        throw new RuntimeException('Unable to parse XLSX worksheet: ' . $sheetName);
    }

    $headerFieldsByIndex = [];
    $headers = [];
    $rows = [];
    $errors = [];
    $seenEmployeeIds = [];
    $seenEmails = [];
    $totalRows = 0;

    try {
        while ($reader->read()) {
            if ($reader->nodeType !== XMLReader::ELEMENT || $reader->localName !== 'row') {
                continue;
            }
            $rowNumber = (int)($reader->getAttribute('r') ?: 0);
            $node = $reader->expand();
            if (!$node) {
                continue;
            }
            $values = [];
            foreach ($node->getElementsByTagName('c') as $cell) {
                if (!$cell instanceof DOMElement) {
                    continue;
                }
                $index = ktv_roster_column_index($cell->getAttribute('r'));
                $values[$index] = ktv_roster_cell_value($cell, $sharedStrings);
            }

            if ($rowNumber === 1) {
                foreach ($values as $index => $value) {
                    $header = trim((string)$value);
                    $headers[$index] = $header;
                    if (isset($requiredHeaders[$header])) {
                        $headerFieldsByIndex[$index] = $requiredHeaders[$header];
                    }
                }
                $missing = [];
                foreach ($requiredHeaders as $header => $field) {
                    if (!in_array($field, $headerFieldsByIndex, true)) {
                        $missing[] = $header;
                    }
                }
                if ($missing) {
                    $errors[] = [
                        'sheet' => $sheetName,
                        'row' => 1,
                        'message' => 'Missing required headers: ' . implode(', ', $missing),
                    ];
                    break;
                }
                continue;
            }

            if (!$headerFieldsByIndex) {
                continue;
            }
            $hasMappedValue = false;
            foreach (array_keys($headerFieldsByIndex) as $index) {
                if (trim((string)($values[$index] ?? '')) !== '') {
                    $hasMappedValue = true;
                    break;
                }
            }
            if (!$hasMappedValue) {
                continue;
            }
            $totalRows++;

            $raw = [];
            foreach ($headerFieldsByIndex as $index => $field) {
                $raw[$field] = $values[$index] ?? '';
            }

            try {
                $normalized = $normalizer($raw, $rowNumber, $uses1904Dates);
                $normalized['source_sheet'] = $sheetName;
                $employeeId = (string)($normalized['employee_id'] ?? '');
                $email = strtolower(trim((string)($normalized['email'] ?? '')));
                if ($employeeId !== '' && isset($seenEmployeeIds[$employeeId])) {
                    throw new RuntimeException("Row $rowNumber duplicates Empl ID $employeeId.");
                }
                if ($email !== '' && isset($seenEmails[$email])) {
                    throw new RuntimeException("Row $rowNumber duplicates Email $email.");
                }
                if ($employeeId !== '') {
                    $seenEmployeeIds[$employeeId] = true;
                }
                if ($email !== '') {
                    $seenEmails[$email] = true;
                }
                $rows[] = $normalized;
            } catch (Throwable $exception) {
                $errors[] = [
                    'sheet' => $sheetName,
                    'row' => $rowNumber,
                    'message' => $exception->getMessage(),
                ];
            }
        }
    } finally {
        $reader->close();
    }

    return [
        'name' => $sheetName,
        'headers' => array_values($headers),
        'rows' => $rows,
        'errors' => $errors,
        'totalRows' => $totalRows,
    ];
}

function parse_ktv_roster_xlsx(string $path): array
{
    if (!is_file($path)) {
        throw new RuntimeException('KTV roster workbook not found: ' . $path);
    }
    if (!class_exists(ZipArchive::class)) {
        throw new RuntimeException('PHP ZipArchive extension is required to read XLSX files.');
    }

    $zip = new ZipArchive();
    if ($zip->open($path) !== true) {
        throw new RuntimeException('Unable to open KTV roster workbook: ' . $path);
    }

    try {
        $sharedStrings = ktv_roster_shared_strings($zip);
        $uses1904Dates = ktv_roster_uses_1904_dates($zip);
        $sheets = ktv_roster_workbook_sheets($zip);
        $activeSheet = null;
        $terminationSheet = null;
        foreach ($sheets as $sheet) {
            $sheetName = ktv_roster_sheet_name_key((string)($sheet['name'] ?? ''));
            if ($sheetName === 'tân binh' && $activeSheet === null) {
                $activeSheet = $sheet;
            }
            if ($sheetName === 'nghỉ việc' && $terminationSheet === null) {
                $terminationSheet = $sheet;
            }
        }
        $activeSheet ??= $sheets[0];
        $isDeltaWorkbook = ktv_roster_sheet_name_key((string)($activeSheet['name'] ?? '')) === 'tân binh'
            || $terminationSheet !== null;

        $active = ktv_roster_parse_worksheet(
            $zip,
            $activeSheet,
            $sharedStrings,
            $uses1904Dates,
            KTV_ROSTER_REQUIRED_HEADERS,
            'ktv_roster_normalize_row'
        );
        $termination = [
            'name' => null,
            'headers' => [],
            'rows' => [],
            'errors' => [],
            'totalRows' => 0,
        ];
        if ($terminationSheet !== null && $terminationSheet !== $activeSheet) {
            $termination = ktv_roster_parse_worksheet(
                $zip,
                $terminationSheet,
                $sharedStrings,
                $uses1904Dates,
                KTV_ROSTER_TERMINATION_REQUIRED_HEADERS,
                'ktv_roster_normalize_termination_row'
            );
        }

        $errors = array_merge($active['errors'], $termination['errors']);
        $activeEmployeeIds = [];
        $activeEmails = [];
        foreach ($active['rows'] as $row) {
            $activeEmployeeIds[(string)$row['employee_id']] = true;
            $activeEmails[strtolower((string)$row['email'])] = true;
        }
        foreach ($termination['rows'] as $row) {
            $employeeId = (string)$row['employee_id'];
            $email = strtolower(trim((string)($row['email'] ?? '')));
            if (isset($activeEmployeeIds[$employeeId]) || ($email !== '' && isset($activeEmails[$email]))) {
                $errors[] = [
                    'sheet' => $termination['name'],
                    'row' => $row['source_row'] ?? null,
                    'message' => 'The same employee cannot appear in both active and termination sheets.',
                ];
            }
        }

        $totalRows = (int)$active['totalRows'] + (int)$termination['totalRows'];

        return [
            'headers' => $active['headers'],
            'rows' => $active['rows'],
            'termination_headers' => $termination['headers'],
            'termination_rows' => $termination['rows'],
            'errors' => $errors,
            'totalRows' => $totalRows,
            'total_rows' => $totalRows,
            'activeRows' => count($active['rows']),
            'active_rows' => count($active['rows']),
            'terminationRows' => count($termination['rows']),
            'termination_row_count' => count($termination['rows']),
            'importMode' => $isDeltaWorkbook ? 'delta' : 'snapshot',
            'import_mode' => $isDeltaWorkbook ? 'delta' : 'snapshot',
            'sheetNames' => array_values(array_map(
                static fn(array $sheet): string => (string)($sheet['name'] ?? ''),
                $sheets
            )),
            'sheet_names' => array_values(array_map(
                static fn(array $sheet): string => (string)($sheet['name'] ?? ''),
                $sheets
            )),
        ];
    } finally {
        $zip->close();
    }
}

function ktv_roster_database_boolean(mixed $value): bool
{
    if (is_bool($value)) {
        return $value;
    }
    if (is_int($value)) {
        return $value === 1;
    }
    return in_array(strtolower(trim((string)$value)), ['1', 't', 'true', 'yes', 'y', 'on'], true);
}

function ktv_roster_compact_change(array $row): array
{
    return [
        'employee_id' => $row['employee_id'] ?? null,
        'display_name' => $row['display_name'] ?? null,
        'email' => $row['email'] ?? null,
        'region' => $row['dashboard_region'] ?? null,
        'branch' => $row['branch'] ?? null,
        'class_code' => $row['class_code'] ?? null,
        'source_row' => $row['source_row'] ?? null,
    ];
}

function ktv_roster_load_unit_cache(PDO $pdo): array
{
    $stmt = $pdo->query(
        <<<'SQL'
        SELECT unit.unit_id, unit.unit_code, unit.unit_name,
               region.region_id, region.region_code, region.region_name,
               region.dashboard_group
          FROM org_units unit
          JOIN regions region ON region.region_id = unit.region_id
         WHERE unit.is_active = TRUE
           AND region.is_active = TRUE
         ORDER BY unit.unit_code
        SQL
    );
    $cache = [];
    foreach ($stmt->fetchAll() as $unit) {
        $unitCode = strtoupper(trim((string)($unit['unit_code'] ?? '')));
        if ($unitCode !== '') {
            $cache[$unitCode] = $unit;
        }
    }
    return $cache;
}

function ktv_roster_resolve_unit(array $row, array $cache): array
{
    $unitCode = strtoupper(trim((string)($row['unit_code'] ?? '')));
    if ($unitCode === '') {
        throw new RuntimeException('Unit code is required and must exist in the organization catalog.');
    }
    $unit = $cache[$unitCode] ?? null;
    if (!is_array($unit)) {
        throw new RuntimeException("Unsupported unit code: $unitCode.");
    }
    $sourceRegion = strtoupper(trim((string)($row['region_code'] ?? '')));
    $catalogRegion = strtoupper(trim((string)($unit['region_code'] ?? '')));
    if ($sourceRegion === '' || $sourceRegion !== $catalogRegion) {
        throw new RuntimeException(
            "Unit $unitCode belongs to region $catalogRegion, not $sourceRegion."
        );
    }
    return $unit;
}

function ktv_roster_load_user_match_cache(PDO $pdo, array $rows, bool $forUpdate): array
{
    $cache = [
        'by_employee_id' => [],
        'by_email' => [],
    ];
    if (!$rows) {
        return $cache;
    }

    $lookupRows = array_map(static fn(array $row): array => [
        'employee_id' => (string)$row['employee_id'],
        'email' => strtolower((string)$row['email']),
    ], $rows);
    $encodedRows = json_encode($lookupRows, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    $sql = <<<'SQL'
        SELECT existing_user.user_id,
               existing_user.email,
               existing_user.employee_id,
               existing_user.display_name,
               existing_user.is_terminated,
               existing_user.employee_source,
               existing_user.role,
               existing_user.dashboard_region,
               existing_user.class_code
          FROM users AS existing_user
         WHERE EXISTS (
               SELECT 1
                 FROM jsonb_to_recordset(CAST(:roster_rows AS jsonb))
                      AS roster_row(employee_id text, email text)
                WHERE existing_user.employee_id = roster_row.employee_id
                   OR LOWER(existing_user.email) = roster_row.email
         )
        SQL;
    if ($forUpdate) {
        $sql .= ' FOR UPDATE OF existing_user';
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['roster_rows' => $encodedRows]);

    foreach ($stmt->fetchAll() as $user) {
        $employeeId = trim((string)($user['employee_id'] ?? ''));
        $email = strtolower(trim((string)($user['email'] ?? '')));
        if ($employeeId !== '') {
            $cache['by_employee_id'][$employeeId][] = $user;
        }
        if ($email !== '') {
            $cache['by_email'][$email][] = $user;
        }
    }
    return $cache;
}

function ktv_roster_cached_user_matches(array $cache, array $row): array
{
    $matches = [];
    $employeeId = (string)$row['employee_id'];
    $email = strtolower((string)$row['email']);
    foreach (array_merge(
        $cache['by_employee_id'][$employeeId] ?? [],
        $cache['by_email'][$email] ?? []
    ) as $match) {
        $userId = (string)($match['user_id'] ?? '');
        if ($userId !== '') {
            $matches[$userId] = $match;
        }
    }
    return array_values($matches);
}

function ktv_roster_find_matching_user(PDO $pdo, array $row, bool $forUpdate): array
{
    $sql = 'SELECT user_id, email, employee_id, display_name, is_terminated, employee_source
              FROM users
             WHERE employee_id = :employee_id
                OR LOWER(email) = LOWER(:email)';
    if ($forUpdate) {
        $sql .= ' FOR UPDATE';
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        'employee_id' => $row['employee_id'],
        'email' => $row['email'],
    ]);
    return $stmt->fetchAll();
}

function sync_ktv_roster(
    PDO $pdo,
    array $rows,
    string $batch,
    bool $dryRun = false,
    array $terminationRows = [],
    bool $terminateMissing = true
): array
{
    $totalRows = count($rows) + count($terminationRows);
    $result = [
        'batch_id' => $batch,
        'dryRun' => $dryRun,
        'dry_run' => $dryRun,
        'totalRows' => $totalRows,
        'total_rows' => $totalRows,
        'activeRows' => count($rows),
        'active_rows' => count($rows),
        'terminationRows' => count($terminationRows),
        'termination_rows' => count($terminationRows),
        'importMode' => $terminateMissing ? 'snapshot' : 'delta',
        'import_mode' => $terminateMissing ? 'snapshot' : 'delta',
        'terminationMode' => $terminateMissing ? 'missing' : 'explicit',
        'termination_mode' => $terminateMissing ? 'missing' : 'explicit',
        'inserted' => 0,
        'updated' => 0,
        'terminated' => 0,
        'reactivated' => 0,
        'errors' => [],
        'changes' => [
            'inserted' => [],
            'updated' => [],
            'terminated' => [],
            'reactivated' => [],
        ],
    ];

    $activeEmployeeIds = [];
    $activeEmails = [];
    $unitCache = ktv_roster_load_unit_cache($pdo);
    $userMatchCache = ktv_roster_load_user_match_cache(
        $pdo,
        array_merge($rows, $terminationRows),
        !$dryRun
    );

    $insertUser = null;
    $updateUser = null;
    if (!$dryRun) {
        $insertUser = $pdo->prepare(
            <<<'SQL'
            INSERT INTO users (
                email, display_name, role, iam_profile,
                employee_id, job_title,
                class_code, is_terminated, termination_date, termination_reason,
                unit_id, unit_code, unit_name, region_code, dashboard_region, region_id,
                employee_source, employee_seed_batch, employee_synced_at,
                created_at, updated_at
            ) VALUES (
                :email, :display_name, 'KTV', '{}'::jsonb,
                :employee_id, :job_title,
                :class_code, FALSE, NULL, NULL,
                :unit_id, :unit_code, :unit_name, :region_code, :dashboard_region, :region_id,
                :employee_source, :employee_seed_batch, NOW(),
                NOW(), NOW()
            )
            SQL
        );
        $updateUser = $pdo->prepare(
            <<<'SQL'
            UPDATE users
               SET email = :email,
                   display_name = :display_name,
                   employee_id = :employee_id,
                   job_title = :job_title,
                   class_code = :class_code,
                   is_terminated = FALSE,
                   termination_date = NULL,
                   termination_reason = NULL,
                   unit_id = :unit_id,
                   unit_code = :unit_code,
                   unit_name = :unit_name,
                   region_code = :region_code,
                   dashboard_region = :dashboard_region,
                   region_id = :region_id,
                   employee_source = :employee_source,
                   employee_seed_batch = :employee_seed_batch,
                   employee_synced_at = NOW(),
                   updated_at = NOW()
             WHERE user_id = :user_id
            SQL
        );
    }

    foreach ($rows as $row) {
        $activeEmployeeIds[$row['employee_id']] = true;
        $activeEmails[strtolower((string)$row['email'])] = true;

        try {
            $unit = ktv_roster_resolve_unit($row, $unitCache);
            $regionId = (string)$unit['region_id'];
            $row['unit_code'] = (string)$unit['unit_code'];
            $row['unit_name'] = (string)$unit['unit_name'];
            $row['region_code'] = (string)$unit['region_code'];
            $row['dashboard_region'] = (string)($unit['dashboard_group'] ?: $unit['region_name']);
            $row['branch'] = (string)$unit['unit_name'];
            $matches = ktv_roster_cached_user_matches($userMatchCache, $row);
            $userIds = array_values(array_unique(array_map(static fn(array $match): string => (string)$match['user_id'], $matches)));
            if (count($userIds) > 1) {
                $result['errors'][] = [
                    'row' => $row['source_row'] ?? null,
                    'employee_id' => $row['employee_id'],
                    'email' => $row['email'],
                    'message' => 'Empl ID and Email are currently assigned to different users.',
                ];
                continue;
            }

            $existing = $matches[0] ?? null;
            if ($existing && !empty($existing['employee_id']) && (string)$existing['employee_id'] !== (string)$row['employee_id']) {
                $result['errors'][] = [
                    'row' => $row['source_row'] ?? null,
                    'employee_id' => $row['employee_id'],
                    'email' => $row['email'],
                    'message' => 'Email already belongs to another Empl ID: ' . $existing['employee_id'],
                ];
                continue;
            }

            $parameters = [
                'email' => $row['email'],
                'display_name' => $row['display_name'],
                'employee_id' => $row['employee_id'],
                'job_title' => $row['job_title'],
                'class_code' => $row['class_code'],
                'unit_id' => $unit['unit_id'],
                'unit_code' => $row['unit_code'],
                'unit_name' => $row['unit_name'],
                'region_code' => $row['region_code'],
                'dashboard_region' => $row['dashboard_region'],
                'region_id' => $regionId,
                'employee_source' => KTV_ROSTER_IMPORT_SOURCE,
                'employee_seed_batch' => $batch,
            ];

            if (!$existing) {
                $result['inserted']++;
                $result['changes']['inserted'][] = ktv_roster_compact_change($row);
                if (!$dryRun && $insertUser) {
                    $insertUser->execute($parameters);
                }
                continue;
            }

            $wasTerminated = ktv_roster_database_boolean($existing['is_terminated'] ?? false);
            if ($wasTerminated) {
                $result['reactivated']++;
                $result['changes']['reactivated'][] = ktv_roster_compact_change($row);
            } else {
                $result['updated']++;
                $result['changes']['updated'][] = ktv_roster_compact_change($row);
            }
            if (!$dryRun && $updateUser) {
                $parameters['user_id'] = $existing['user_id'];
                $updateUser->execute($parameters);
            }
        } catch (Throwable $exception) {
            $result['errors'][] = [
                'row' => $row['source_row'] ?? null,
                'employee_id' => $row['employee_id'] ?? null,
                'email' => $row['email'] ?? null,
                'message' => $exception->getMessage(),
            ];
        }
    }

    $terminateUser = null;
    $terminationDate = (new DateTimeImmutable('now', new DateTimeZone(normalize_app_timezone(env_value('APP_TIMEZONE')))))->format('Y-m-d');
    $terminationReason = $terminateMissing
        ? 'Không có trong danh sách import ngày ' . $terminationDate
        : 'Có trong sheet Nghỉ việc của file import ngày ' . $terminationDate;
    if (!$dryRun) {
        $terminateUser = $pdo->prepare(
            'UPDATE users
                SET is_terminated = TRUE,
                    termination_date = :termination_date,
                    termination_reason = :termination_reason,
                    employee_seed_batch = :employee_seed_batch,
                    employee_synced_at = NOW(),
                    updated_at = NOW()
              WHERE user_id = :user_id'
        );
    }

    $terminationCandidates = [];
    if ($terminateMissing) {
        $sql = 'SELECT user_id, employee_id, email, display_name, dashboard_region, class_code,
                       role, is_terminated, employee_source
                  FROM users
                 WHERE employee_source = :employee_source
                   AND is_terminated = FALSE';
        if (!$dryRun) {
            $sql .= ' FOR UPDATE';
        }
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['employee_source' => KTV_ROSTER_IMPORT_SOURCE]);
        foreach ($stmt->fetchAll() as $managed) {
            $employeeId = (string)($managed['employee_id'] ?? '');
            $email = strtolower((string)($managed['email'] ?? ''));
            if (($employeeId !== '' && isset($activeEmployeeIds[$employeeId]))
                || ($email !== '' && isset($activeEmails[$email]))) {
                continue;
            }
            $terminationCandidates[] = $managed;
        }
    } else {
        foreach ($terminationRows as $row) {
            $matches = ktv_roster_cached_user_matches($userMatchCache, $row);
            $userIds = array_values(array_unique(array_map(
                static fn(array $match): string => (string)($match['user_id'] ?? ''),
                $matches
            )));
            $userIds = array_values(array_filter($userIds, static fn(string $userId): bool => $userId !== ''));
            if (count($userIds) > 1) {
                $result['errors'][] = [
                    'sheet' => $row['source_sheet'] ?? 'Nghỉ việc',
                    'row' => $row['source_row'] ?? null,
                    'employee_id' => $row['employee_id'] ?? null,
                    'email' => $row['email'] ?? null,
                    'message' => 'Empl ID and Email are currently assigned to different users.',
                ];
                continue;
            }
            $existing = $matches[0] ?? null;
            if (!$existing) {
                $result['errors'][] = [
                    'sheet' => $row['source_sheet'] ?? 'Nghỉ việc',
                    'row' => $row['source_row'] ?? null,
                    'employee_id' => $row['employee_id'] ?? null,
                    'email' => $row['email'] ?? null,
                    'message' => 'No matching KTV was found for the termination row.',
                ];
                continue;
            }
            if (strtoupper(trim((string)($existing['role'] ?? ''))) !== 'KTV') {
                $result['errors'][] = [
                    'sheet' => $row['source_sheet'] ?? 'Nghỉ việc',
                    'row' => $row['source_row'] ?? null,
                    'employee_id' => $row['employee_id'] ?? null,
                    'email' => $row['email'] ?? null,
                    'message' => 'The termination row matches a user who is not a KTV.',
                ];
                continue;
            }
            $providedEmployeeId = trim((string)($row['employee_id'] ?? ''));
            $existingEmployeeId = trim((string)($existing['employee_id'] ?? ''));
            if ($existingEmployeeId === '' || $providedEmployeeId !== $existingEmployeeId) {
                $result['errors'][] = [
                    'sheet' => $row['source_sheet'] ?? 'Nghỉ việc',
                    'row' => $row['source_row'] ?? null,
                    'employee_id' => $row['employee_id'] ?? null,
                    'email' => $row['email'] ?? null,
                    'message' => 'Empl ID does not match the KTV identified by Email.',
                ];
                continue;
            }
            $providedEmail = strtolower(trim((string)($row['email'] ?? '')));
            $existingEmail = strtolower(trim((string)($existing['email'] ?? '')));
            if ($providedEmail !== '' && $existingEmail !== '' && $providedEmail !== $existingEmail) {
                $result['errors'][] = [
                    'sheet' => $row['source_sheet'] ?? 'Nghỉ việc',
                    'row' => $row['source_row'] ?? null,
                    'employee_id' => $row['employee_id'] ?? null,
                    'email' => $row['email'] ?? null,
                    'message' => 'Email does not match the KTV identified by Empl ID.',
                ];
                continue;
            }
            if (ktv_roster_database_boolean($existing['is_terminated'] ?? false)) {
                continue;
            }
            $existing['source_row'] = $row['source_row'] ?? null;
            $existing['source_sheet'] = $row['source_sheet'] ?? 'Nghỉ việc';
            $terminationCandidates[] = $existing;
        }
    }

    foreach ($terminationCandidates as $managed) {
        $employeeId = (string)($managed['employee_id'] ?? '');
        $result['terminated']++;
        $result['changes']['terminated'][] = [
            'employee_id' => $employeeId,
            'display_name' => $managed['display_name'] ?? null,
            'email' => $managed['email'] ?? null,
            'region' => $managed['dashboard_region'] ?? null,
            'class_code' => $managed['class_code'] ?? null,
            'source_row' => $managed['source_row'] ?? null,
            'source_sheet' => $managed['source_sheet'] ?? null,
        ];
        if (!$dryRun && $terminateUser) {
            $terminateUser->execute([
                'termination_date' => $terminationDate,
                'termination_reason' => $terminationReason,
                'employee_seed_batch' => $batch,
                'user_id' => $managed['user_id'],
            ]);
        }
    }

    if (!$dryRun && !$result['errors']) {
        $syncSnapshots = $pdo->prepare(
            <<<'SQL'
            UPDATE lab_assignments assignment
               SET unit_id_snapshot = roster.unit_id,
                   region_id_snapshot = roster.region_id,
                   updated_at = NOW()
              FROM class_enrollments enrollment
              JOIN users roster ON roster.user_id = enrollment.user_id
             WHERE enrollment.enrollment_id = assignment.enrollment_id
               AND roster.employee_seed_batch = :batch
               AND (
                   assignment.unit_id_snapshot IS DISTINCT FROM roster.unit_id
                   OR assignment.region_id_snapshot IS DISTINCT FROM roster.region_id
               )
            SQL
        );
        $syncSnapshots->execute(['batch' => $batch]);
    }

    $result['error_count'] = count($result['errors']);
    $result['errorCount'] = count($result['errors']);
    return $result;
}

function ktv_roster_existing_imported_by(PDO $pdo, ?string $userId): ?string
{
    if (!$userId) {
        return null;
    }
    $stmt = $pdo->prepare('SELECT user_id FROM users WHERE user_id = :user_id');
    $stmt->execute(['user_id' => $userId]);
    $found = $stmt->fetchColumn();
    return is_string($found) && $found !== '' ? $found : null;
}

function ktv_roster_log_import(PDO $pdo, array $result, ?string $importedBy, ?string $fileName): void
{
    $stmt = $pdo->prepare(
        <<<'SQL'
        INSERT INTO roster_import_log (
            batch_id, imported_by, file_name, total_rows,
            inserted, updated, terminated, reactivated,
            error_count, error_details, imported_at
        ) VALUES (
            :batch_id, :imported_by, :file_name, :total_rows,
            :inserted, :updated, :terminated, :reactivated,
            :error_count, CAST(:error_details AS jsonb), NOW()
        )
        ON CONFLICT (batch_id) DO UPDATE SET
            imported_by = EXCLUDED.imported_by,
            file_name = EXCLUDED.file_name,
            total_rows = EXCLUDED.total_rows,
            inserted = EXCLUDED.inserted,
            updated = EXCLUDED.updated,
            terminated = EXCLUDED.terminated,
            reactivated = EXCLUDED.reactivated,
            error_count = EXCLUDED.error_count,
            error_details = EXCLUDED.error_details,
            imported_at = NOW()
        SQL
    );
    $stmt->execute([
        'batch_id' => $result['batch_id'],
        'imported_by' => $importedBy,
        'file_name' => $fileName,
        'total_rows' => $result['total_rows'] ?? $result['totalRows'] ?? 0,
        'inserted' => $result['inserted'] ?? 0,
        'updated' => $result['updated'] ?? 0,
        'terminated' => $result['terminated'] ?? 0,
        'reactivated' => $result['reactivated'] ?? 0,
        'error_count' => $result['error_count'] ?? 0,
        'error_details' => json_encode($result['errors'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);
}
