<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/api/lib/ktv_roster_import.php';

const TEST_SPREADSHEET_NAMESPACE = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const TEST_DOCUMENT_RELATIONSHIPS_NAMESPACE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const TEST_PACKAGE_RELATIONSHIPS_NAMESPACE = 'http://schemas.openxmlformats.org/package/2006/relationships';

function test_xml_escape(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_XML1, 'UTF-8');
}

function test_expect_same(mixed $expected, mixed $actual, string $message): void
{
    if ($expected === $actual) {
        return;
    }

    throw new RuntimeException(sprintf(
        "%s\nExpected: %s\nActual: %s",
        $message,
        json_encode($expected, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        json_encode($actual, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ));
}

function test_add_zip_entry(ZipArchive $zip, string $path, string $contents): void
{
    if (!$zip->addFromString($path, $contents)) {
        throw new RuntimeException("Unable to add synthetic XLSX entry: $path");
    }
}

function test_roster_sheet_xml(bool $prefixed, array $rows): string
{
    $prefix = $prefixed ? 'x:' : '';
    $namespace = $prefixed
        ? ' xmlns:x="' . TEST_SPREADSHEET_NAMESPACE . '"'
        : ' xmlns="' . TEST_SPREADSHEET_NAMESPACE . '"';
    $rowXml = [];

    foreach ($rows as $rowNumber => $cells) {
        $cellXml = [];
        foreach ($cells as $column => $sharedStringIndex) {
            if ($sharedStringIndex === null) {
                $cellXml[] = sprintf('<%1$sc r="%2$s%3$d" />', $prefix, $column, $rowNumber);
                continue;
            }
            $cellXml[] = sprintf(
                '<%1$sc r="%2$s%3$d" t="s"><%1$sv>%4$d</%1$sv></%1$sc>',
                $prefix,
                $column,
                $rowNumber,
                $sharedStringIndex,
            );
        }
        $rowXml[] = sprintf(
            '<%1$srow r="%2$d">%3$s</%1$srow>',
            $prefix,
            $rowNumber,
            implode('', $cellXml),
        );
    }

    return sprintf(
        '<?xml version="1.0" encoding="UTF-8"?>'
        . '<%1$sworksheet%2$s><%1$ssheetData>%3$s</%1$ssheetData></%1$sworksheet>',
        $prefix,
        $namespace,
        implode('', $rowXml),
    );
}

function test_create_roster_xlsx(bool $prefixed, bool $includeTerminationSheet): string
{
    $path = tempnam(sys_get_temp_dir(), 'ktv_roster_parser_');
    if ($path === false) {
        throw new RuntimeException('Unable to allocate a temporary XLSX fixture.');
    }

    $zip = new ZipArchive();
    $status = $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    if ($status !== true) {
        @unlink($path);
        throw new RuntimeException("Unable to create a temporary XLSX fixture (ZipArchive status $status).");
    }

    $prefix = $prefixed ? 'x:' : '';
    $spreadsheetNamespace = $prefixed
        ? ' xmlns:x="' . TEST_SPREADSHEET_NAMESPACE . '"'
        : ' xmlns="' . TEST_SPREADSHEET_NAMESPACE . '"';

    $sharedStrings = [
        'TT',
        'Empl ID',
        'Name',
        'Email',
        'Job Title (VN)',
        'Branch',
        'Parent Department',
        'Child Department 1',
        'Child Department 2',
        'Ghi chú xếp lớp',
        '1',
        '00123456',
        'Nguyễn Văn Test',
        'ktv.fixture@example.test',
        'CB Kỹ thuật',
        'TIN',
        'TINHNI',
        'HNI001',
        'HN001',
        '00987654',
        'Nhân viên nghỉ',
        'former.fixture@example.test',
    ];
    $sharedStringItems = array_map(
        static fn(string $value): string => sprintf(
            '<%1$ssi><%1$st xml:space="preserve">%2$s</%1$st></%1$ssi>',
            $prefix,
            test_xml_escape($value),
        ),
        $sharedStrings,
    );

    $newHireHeaders = [
        'A' => 0,
        'B' => 1,
        'C' => 2,
        'D' => 3,
        'E' => 4,
        'F' => 5,
        'G' => 6,
        'H' => 7,
        'I' => 8,
        'J' => 9,
    ];
    $newHireRow = [
        'A' => 10,
        'B' => 11,
        'C' => 12,
        'D' => 13,
        'E' => 14,
        'F' => 15,
        'G' => 16,
        'H' => 17,
        'I' => 17,
        'J' => 18,
    ];
    $emptyNewHireTemplateRow = array_fill_keys(range('A', 'J'), null);
    $terminationHeaders = ['A' => 0, 'B' => 1, 'C' => 2, 'D' => 3];
    $terminationRow = ['A' => 10, 'B' => 19, 'C' => 20, 'D' => 21];
    $emptyTerminationTemplateRow = array_fill_keys(range('A', 'D'), null);
    $activeSheetName = $includeTerminationSheet ? 'Tân binh' : 'Danh sách KTV';

    try {
        test_add_zip_entry(
            $zip,
            '[Content_Types].xml',
            '<?xml version="1.0" encoding="UTF-8"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />'
            . '<Default Extension="xml" ContentType="application/xml" />'
            . '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" />'
            . '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml" />'
            . '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />'
            . ($includeTerminationSheet
                ? '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />'
                : '')
            . '</Types>',
        );
        test_add_zip_entry(
            $zip,
            '_rels/.rels',
            '<?xml version="1.0" encoding="UTF-8"?>'
            . '<Relationships xmlns="' . TEST_PACKAGE_RELATIONSHIPS_NAMESPACE . '">'
            . '<Relationship Id="rIdWorkbook" Type="' . TEST_DOCUMENT_RELATIONSHIPS_NAMESPACE . '/officeDocument" Target="xl/workbook.xml" />'
            . '</Relationships>',
        );
        test_add_zip_entry(
            $zip,
            'xl/workbook.xml',
            '<?xml version="1.0" encoding="UTF-8"?>'
            . '<' . $prefix . 'workbook' . $spreadsheetNamespace
            . ' xmlns:r="' . TEST_DOCUMENT_RELATIONSHIPS_NAMESPACE . '">'
            . '<' . $prefix . 'sheets>'
            . '<' . $prefix . 'sheet name="' . test_xml_escape($activeSheetName) . '" sheetId="1" r:id="rIdNew" />'
            . ($includeTerminationSheet
                ? '<' . $prefix . 'sheet name="Nghỉ việc" sheetId="2" r:id="rIdLeft" />'
                : '')
            . '</' . $prefix . 'sheets>'
            . '</' . $prefix . 'workbook>',
        );
        test_add_zip_entry(
            $zip,
            'xl/_rels/workbook.xml.rels',
            '<?xml version="1.0" encoding="UTF-8"?>'
            . '<Relationships xmlns="' . TEST_PACKAGE_RELATIONSHIPS_NAMESPACE . '">'
            . '<Relationship Id="rIdNew" Type="' . TEST_DOCUMENT_RELATIONSHIPS_NAMESPACE . '/worksheet" Target="/xl/worksheets/sheet1.xml" />'
            . ($includeTerminationSheet
                ? '<Relationship Id="rIdLeft" Type="' . TEST_DOCUMENT_RELATIONSHIPS_NAMESPACE . '/worksheet" Target="worksheets/sheet2.xml" />'
                : '')
            . '</Relationships>',
        );
        test_add_zip_entry(
            $zip,
            'xl/sharedStrings.xml',
            '<?xml version="1.0" encoding="UTF-8"?>'
            . '<' . $prefix . 'sst' . $spreadsheetNamespace
            . ' count="' . count($sharedStrings) . '" uniqueCount="' . count($sharedStrings) . '">'
            . implode('', $sharedStringItems)
            . '</' . $prefix . 'sst>',
        );
        test_add_zip_entry(
            $zip,
            'xl/worksheets/sheet1.xml',
            test_roster_sheet_xml($prefixed, [
                1 => $newHireHeaders,
                2 => $newHireRow,
                3 => $emptyNewHireTemplateRow,
            ]),
        );
        if ($includeTerminationSheet) {
            test_add_zip_entry(
                $zip,
                'xl/worksheets/sheet2.xml',
                test_roster_sheet_xml($prefixed, [
                    1 => $terminationHeaders,
                    2 => $terminationRow,
                    3 => $emptyTerminationTemplateRow,
                ]),
            );
        }
    } catch (Throwable $exception) {
        $zip->close();
        @unlink($path);
        throw $exception;
    }

    if (!$zip->close()) {
        @unlink($path);
        throw new RuntimeException('Unable to finalize the temporary XLSX fixture.');
    }

    return $path;
}

function test_active_row(array $row, string $variant): void
{
    test_expect_same('00123456', $row['employee_id'] ?? null, "$variant must preserve an eight-digit employee ID.");
    test_expect_same('Nguyễn Văn Test', $row['display_name'] ?? null, "$variant must preserve UTF-8 names.");
    test_expect_same('ktv.fixture@example.test', $row['email'] ?? null, "$variant must normalize the email.");
    test_expect_same('TINHNI', $row['region_code'] ?? null, "$variant must keep the source region code.");
    test_expect_same('HNI', $row['dashboard_region'] ?? null, "$variant must map the dashboard region.");
    test_expect_same('HNI001', $row['unit_code'] ?? null, "$variant must prefer Child Department 2 as unit code.");
    test_expect_same('HN001', $row['class_code'] ?? null, "$variant must parse the class code.");
    test_expect_same(2, $row['source_row'] ?? null, "$variant must report the source row number.");
}

function test_default_namespace_snapshot_workbook(): void
{
    $path = test_create_roster_xlsx(false, false);
    $variant = 'default namespace snapshot workbook';

    try {
        $zip = new ZipArchive();
        test_expect_same(true, $zip->open($path), "$variant namespace fixture must be a readable ZIP.");
        try {
            $sheets = ktv_roster_workbook_sheets($zip);
        } finally {
            $zip->close();
        }

        test_expect_same(1, count($sheets), "$variant must expose one sheet.");
        test_expect_same('Danh sách KTV', $sheets[0]['name'] ?? null, "$variant must preserve the sheet name.");
        test_expect_same('xl/worksheets/sheet1.xml', $sheets[0]['path'] ?? null, "$variant must resolve an absolute worksheet target.");

        $result = parse_ktv_roster_xlsx($path);
        test_expect_same([], $result['errors'] ?? null, "$variant must parse without validation errors.");
        test_expect_same('snapshot', $result['import_mode'] ?? null, "$variant must use snapshot semantics.");
        test_expect_same(['Danh sách KTV'], $result['sheet_names'] ?? null, "$variant must report its sheet name.");
        test_expect_same(1, $result['totalRows'] ?? null, "$variant empty template row must not count as data.");
        test_expect_same(1, $result['active_rows'] ?? null, "$variant must report one active row.");
        test_expect_same(0, $result['termination_row_count'] ?? null, "$variant must not infer termination rows.");
        test_expect_same([], $result['termination_rows'] ?? null, "$variant must return no explicit termination rows.");
        test_expect_same(1, count($result['rows'] ?? []), "$variant must return exactly one normalized roster row.");
        test_active_row($result['rows'][0] ?? [], $variant);
    } finally {
        @unlink($path);
    }
}

function test_prefixed_namespace_delta_workbook(): void
{
    $path = test_create_roster_xlsx(true, true);
    $variant = 'prefixed x: namespace delta workbook';

    try {
        $zip = new ZipArchive();
        test_expect_same(true, $zip->open($path), "$variant fixture must be a readable ZIP.");
        try {
            $sheets = ktv_roster_workbook_sheets($zip);
        } finally {
            $zip->close();
        }

        test_expect_same(2, count($sheets), "$variant must expose both sheets.");
        test_expect_same('Tân binh', $sheets[0]['name'] ?? null, "$variant must preserve the active sheet name.");
        test_expect_same('xl/worksheets/sheet1.xml', $sheets[0]['path'] ?? null, "$variant must resolve an absolute worksheet target.");
        test_expect_same('Nghỉ việc', $sheets[1]['name'] ?? null, "$variant must preserve the termination sheet name.");
        test_expect_same('xl/worksheets/sheet2.xml', $sheets[1]['path'] ?? null, "$variant must resolve a relative worksheet target.");

        $result = parse_ktv_roster_xlsx($path);
        test_expect_same([], $result['errors'] ?? null, "$variant must parse without validation errors.");
        test_expect_same('delta', $result['import_mode'] ?? null, "$variant must use explicit delta semantics.");
        test_expect_same(['Tân binh', 'Nghỉ việc'], $result['sheet_names'] ?? null, "$variant must report both sheet names.");
        test_expect_same(2, $result['totalRows'] ?? null, "$variant blank template rows must not count as data.");
        test_expect_same(1, $result['active_rows'] ?? null, "$variant must report one active row.");
        test_expect_same(1, $result['termination_row_count'] ?? null, "$variant must report one explicit termination row.");
        test_expect_same(1, count($result['rows'] ?? []), "$variant must return exactly one normalized active row.");
        test_expect_same(1, count($result['termination_rows'] ?? []), "$variant must return exactly one normalized termination row.");
        test_active_row($result['rows'][0] ?? [], $variant);

        $termination = $result['termination_rows'][0] ?? [];
        test_expect_same('00987654', $termination['employee_id'] ?? null, "$variant must preserve the terminated employee ID.");
        test_expect_same('Nhân viên nghỉ', $termination['display_name'] ?? null, "$variant must preserve a UTF-8 termination name.");
        test_expect_same('former.fixture@example.test', $termination['email'] ?? null, "$variant must normalize the termination email.");
        test_expect_same('Nghỉ việc', $termination['source_sheet'] ?? null, "$variant must retain the termination source sheet.");
        test_expect_same(2, $termination['source_row'] ?? null, "$variant must retain the termination source row.");
    } finally {
        @unlink($path);
    }
}

try {
    test_default_namespace_snapshot_workbook();
    test_prefixed_namespace_delta_workbook();
    fwrite(STDOUT, "Roster XLSX parser regression fixtures passed.\n");
} catch (Throwable $exception) {
    fwrite(STDERR, $exception->getMessage() . "\n");
    exit(1);
}
