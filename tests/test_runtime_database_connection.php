<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/api/lib/runtime.php';

function assert_same(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        fwrite(STDERR, $message . PHP_EOL);
        exit(1);
    }
}

$resolverCalls = 0;
$resolved = resolve_database_hostaddr(
    'ep-example-pooler.ap-southeast-1.aws.neon.tech',
    static function (string $host) use (&$resolverCalls): array {
        $resolverCalls++;
        return ['not-an-ip', '2001:db8::1', '203.0.113.8', '203.0.113.9'];
    }
);
assert_same('203.0.113.8', $resolved, 'Neon connections should select the first valid IPv4 address.');
assert_same(1, $resolverCalls, 'Neon hostname should be resolved exactly once.');

$resolved = resolve_database_hostaddr(
    'database.internal',
    static function (string $host) use (&$resolverCalls): array {
        $resolverCalls++;
        return ['203.0.113.10'];
    }
);
assert_same(null, $resolved, 'Non-Neon database hosts must keep the normal libpq resolution path.');
assert_same(1, $resolverCalls, 'Non-Neon database hosts must not invoke the IPv4 resolver.');

$resolved = resolve_database_hostaddr(
    'ep-example.neon.tech',
    static fn (string $host): array => ['2001:db8::1', 'invalid']
);
assert_same(null, $resolved, 'Resolution without a valid IPv4 address should safely fall back to libpq.');

echo "Runtime database connection tests passed.\n";
