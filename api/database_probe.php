<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$root = dirname(__DIR__);
require_once __DIR__ . '/lib/runtime.php';
load_app_environment($root);

try {
    $pdo = create_database_connection();
    $pdo->query('SELECT 1');
    fwrite(STDOUT, "Database connection is available.\n");
} catch (PDOException $exception) {
    $sqlState = (string)($exception->errorInfo[0] ?? $exception->getCode());
    $connectionFailure = str_starts_with($sqlState, '08')
        || preg_match('/SQLSTATE\[08[A-Z0-9]{3}\]/', $exception->getMessage()) === 1;
    if (!$connectionFailure) {
        fwrite(STDERR, '[database-probe-error] ' . $exception->getMessage() . PHP_EOL);
        exit(2);
    }
    fwrite(STDERR, '[database-unavailable] ' . $exception->getMessage() . PHP_EOL);
    exit(1);
} catch (Throwable $exception) {
    fwrite(STDERR, '[database-probe-error] ' . $exception->getMessage() . PHP_EOL);
    exit(2);
}
