<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/vendor/autoload.php';
require_once dirname(__DIR__) . '/api/lib/training_classes.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

function class_import_expect(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException($message . '\nExpected: ' . json_encode($expected) . '\nActual: ' . json_encode($actual));
    }
}

function class_import_workbook(bool $formula = false): string
{
    $book = new Spreadsheet();
    $classSheet = $book->getActiveSheet();
    $classSheet->setTitle('Lop');
    $classSheet->fromArray([
        ['Mã lớp', 'Tên lớp', 'Hiệu lực từ'],
        ['FTC-000001', $formula ? '=CONCAT("Lop"," 1")' : 'Lớp KTV Hà Nội', '01/09/2026'],
    ]);
    $memberSheet = $book->createSheet();
    $memberSheet->setTitle('ThanhVien');
    $memberSheet->fromArray([
        ['Mã lớp', 'Mã NV', 'Email', 'Tên KTV'],
        ['FTC-000001', '00123456', 'ktv@example.test', 'Nguyễn Văn Test'],
    ]);
    $deviceSheet = $book->createSheet();
    $deviceSheet->setTitle('ThietBi');
    $deviceSheet->fromArray([
        ['Mã lớp', 'Mã thiết bị'],
        ['FTC-000001', 'DEV_AX3000CV2'],
    ]);
    $path = tempnam(sys_get_temp_dir(), 'class_import_');
    if ($path === false) {
        throw new RuntimeException('Unable to create temporary workbook path.');
    }
    (new Xlsx($book))->save($path);
    $book->disconnectWorksheets();
    return $path;
}

function class_member_workbook(bool $formula = false): string
{
    $book = new Spreadsheet();
    $sheet = $book->getActiveSheet();
    $sheet->setTitle('KTV');
    $sheet->fromArray([
        ['Ma NV', 'Ten KTV', 'Email'],
        ['00123456', $formula ? '=CONCAT("Nguyen"," Van A")' : 'Nguyen Van A', 'ktv@example.test'],
    ]);
    $path = tempnam(sys_get_temp_dir(), 'class_members_');
    if ($path === false) {
        throw new RuntimeException('Unable to create class member workbook path.');
    }
    (new Xlsx($book))->save($path);
    $book->disconnectWorksheets();
    return $path;
}

try {
    $validPath = class_import_workbook();
    $valid = parse_training_class_xlsx($validPath);
    class_import_expect([], $valid['errors'], 'Valid workbook must parse without errors.');
    class_import_expect('FTC-000001', $valid['classes'][0]['class_code'], 'Class code must be preserved.');
    class_import_expect('00123456', $valid['members'][0]['employee_id'], 'Employee ID must remain text.');
    class_import_expect('DEV_AX3000CV2', $valid['devices'][0]['device_id'], 'Device ID must be preserved.');
    @unlink($validPath);

    $formulaPath = class_import_workbook(true);
    $formula = parse_training_class_xlsx($formulaPath);
    class_import_expect(1, count($formula['errors']), 'Formula cells must be rejected.');
    @unlink($formulaPath);

    $memberPath = class_member_workbook();
    $memberImport = parse_training_class_members_xlsx($memberPath);
    class_import_expect([], $memberImport['errors'], 'Valid member workbook must parse without errors.');
    class_import_expect('00123456', $memberImport['members'][0]['employee_id'], 'Imported employee ID must remain text.');
    class_import_expect('ktv@example.test', $memberImport['members'][0]['email'], 'Imported email must be preserved.');
    @unlink($memberPath);

    $memberFormulaPath = class_member_workbook(true);
    $memberFormula = parse_training_class_members_xlsx($memberFormulaPath);
    class_import_expect(1, count($memberFormula['errors']), 'Member formulas must be rejected.');
    @unlink($memberFormulaPath);
    fwrite(STDOUT, "Training class XLSX parser tests passed.\n");
} catch (Throwable $exception) {
    fwrite(STDERR, $exception->getMessage() . "\n");
    exit(1);
}
