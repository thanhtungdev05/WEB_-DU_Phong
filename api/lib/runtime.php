<?php
declare(strict_types=1);

function load_app_environment(string $root): void
{
    $autoload = $root . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';
    if (is_file($autoload)) {
        require_once $autoload;
    }

    $envPath = $root . DIRECTORY_SEPARATOR . '.env';
    if (class_exists(Dotenv\Dotenv::class) && is_file($envPath)) {
        Dotenv\Dotenv::createImmutable($root)->safeLoad();
    } elseif (is_file($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (is_array($lines)) {
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || str_starts_with($line, '#')) {
                    continue;
                }
                if (str_contains($line, '=')) {
                    [$key, $val] = explode('=', $line, 2);
                    $key = trim($key);
                    $val = trim($val);
                    if ($key !== '' && !isset($_ENV[$key]) && !isset($_SERVER[$key])) {
                        $val = trim($val, "'\"");
                        $_ENV[$key] = $val;
                        $_SERVER[$key] = $val;
                        putenv("{$key}={$val}");
                    }
                }
            }
        }
    }
}

function env_value(string $key, ?string $default = null): ?string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return (string)$value;
}

function env_bool(string $key, bool $default = false): bool
{
    $value = env_value($key);
    if ($value === null) {
        return $default;
    }

    $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    return $parsed ?? $default;
}

function env_int(string $key, int $default, int $minimum, int $maximum): int
{
    $value = filter_var(env_value($key), FILTER_VALIDATE_INT);
    if ($value === false) {
        return $default;
    }
    return max($minimum, min($maximum, (int)$value));
}

function database_query_count(): int
{
    return (int)($GLOBALS['database_query_count'] ?? 0);
}

function observe_database_query(): void
{
    $GLOBALS['database_query_count'] = database_query_count() + 1;
}

final class ObservedPDO extends PDO
{
    public function prepare(string $query, array $options = []): PDOStatement|false
    {
        observe_database_query();
        return parent::prepare($query, $options);
    }

    public function query(string $query, ?int $fetchMode = null, mixed ...$fetchModeArgs): PDOStatement|false
    {
        observe_database_query();
        return $fetchMode === null
            ? parent::query($query)
            : parent::query($query, $fetchMode, ...$fetchModeArgs);
    }

    public function exec(string $statement): int|false
    {
        observe_database_query();
        return parent::exec($statement);
    }
}

function normalize_app_timezone(?string $timezone): string
{
    $timezone = trim((string)$timezone);
    if ($timezone === '') {
        $timezone = 'Asia/Ho_Chi_Minh';
    }

    if (!in_array($timezone, timezone_identifiers_list(), true)) {
        throw new RuntimeException('APP_TIMEZONE must be a valid IANA timezone identifier.');
    }

    return $timezone;
}

function api_resource_requires_session(string $resource): bool
{
    return in_array($resource, ['auth', 'iam', 'users', 'roles', 'login_logs', 'tracking', 'dashboard', 'roster', 'classes', 'learning', 'reports'], true);
}

function normalize_neon_options(string $host, ?string $options): ?string
{
    if (!str_contains($host, '.neon.tech')) {
        return $options;
    }

    $hostLabel = explode('.', $host)[0] ?? '';
    if ($hostLabel === '' || !str_starts_with($hostLabel, 'ep-')) {
        return $options;
    }

    if (!$options) {
        return 'endpoint=' . $hostLabel;
    }

    if (preg_match('/(?:^|\s)endpoint=([^\s]+)/', $options, $matches)) {
        $current = $matches[1] ?? '';
        if ($current !== $hostLabel) {
            return preg_replace('/endpoint=[^\s]+/', 'endpoint=' . $hostLabel, $options, 1);
        }
        return $options;
    }

    return trim($options . ' endpoint=' . $hostLabel);
}

function get_active_database_tier(): string
{
    return (string)($GLOBALS['active_database_tier'] ?? 'primary');
}

function parse_database_url_to_pdo_params(string $databaseUrl): array
{
    $parts = parse_url($databaseUrl);
    if (!$parts || empty($parts['host']) || empty($parts['path'])) {
        throw new RuntimeException('DATABASE_URL is invalid.');
    }

    $host = (string)$parts['host'];
    $port = (string)($parts['port'] ?? 5432);
    $dbname = rawurldecode(ltrim((string)$parts['path'], '/'));
    $user = rawurldecode((string)($parts['user'] ?? ''));
    $password = rawurldecode((string)($parts['pass'] ?? ''));
    $query = [];
    parse_str((string)($parts['query'] ?? ''), $query);
    $sslmode = env_value('PGSSLMODE', (string)($query['sslmode'] ?? 'prefer'));
    $connectTimeout = env_value('PGCONNECT_TIMEOUT', isset($query['connect_timeout']) ? (string)$query['connect_timeout'] : null);
    $options = env_value('PGOPTIONS', isset($query['options']) ? (string)$query['options'] : null);

    return [
        'host' => $host,
        'port' => $port,
        'dbname' => $dbname,
        'user' => $user,
        'password' => $password,
        'sslmode' => $sslmode,
        'connectTimeout' => $connectTimeout,
        'options' => $options,
    ];
}

function connect_pdo_from_params(array $params): PDO
{
    $options = normalize_neon_options((string)$params['host'], $params['options'] ?? null);
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s',
        $params['host'],
        $params['port'],
        $params['dbname'],
        $params['sslmode']
    );
    if (!empty($params['connectTimeout'])) {
        $dsn .= ';connect_timeout=' . $params['connectTimeout'];
    }
    if ($options) {
        $dsn .= ';options=' . $options;
    }

    $pdo = new ObservedPDO($dsn, (string)$params['user'], (string)$params['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => env_bool('DB_EMULATE_PREPARES', true),
        PDO::ATTR_STRINGIFY_FETCHES => false,
    ]);

    $timezoneStatement = $pdo->prepare("SELECT set_config('TimeZone', :timezone, false)");
    $timezoneStatement->execute([
        'timezone' => normalize_app_timezone(env_value('APP_TIMEZONE')),
    ]);

    return $pdo;
}

function create_database_connection(): PDO
{
    $primaryUrl = env_value('DATABASE_URL');
    $fallbackUrl = env_value('FALLBACK_DATABASE_URL');
    $forceFallback = env_bool('DATABASE_FORCE_FALLBACK', false);

    if ($forceFallback && $fallbackUrl) {
        try {
            $params = parse_database_url_to_pdo_params($fallbackUrl);
            $pdo = connect_pdo_from_params($params);
            $GLOBALS['active_database_tier'] = 'fallback';
            return $pdo;
        } catch (Throwable $exception) {
            error_log('[db-failover] Forced fallback connection failed: ' . $exception->getMessage());
        }
    }

    // Attempt connection to Primary Database
    try {
        if ($primaryUrl) {
            $params = parse_database_url_to_pdo_params($primaryUrl);
        } else {
            $host = env_value('PGHOST', '127.0.0.1');
            $port = env_value('PGPORT', '5432');
            $dbname = env_value('PGDATABASE');
            $user = env_value('PGUSER');
            $password = env_value('PGPASSWORD', '');
            $sslmode = env_value('PGSSLMODE', 'prefer');
            $connectTimeout = env_value('PGCONNECT_TIMEOUT');
            $options = env_value('PGOPTIONS');

            if (!$dbname || !$user) {
                throw new RuntimeException('PostgreSQL config is missing. Set DATABASE_URL or PG* variables.');
            }

            $params = [
                'host' => $host,
                'port' => $port,
                'dbname' => $dbname,
                'user' => $user,
                'password' => $password,
                'sslmode' => $sslmode,
                'connectTimeout' => $connectTimeout,
                'options' => $options,
            ];
        }

        $pdo = connect_pdo_from_params($params);
        $GLOBALS['active_database_tier'] = 'primary';
        return $pdo;
    } catch (Throwable $primaryException) {
        if ($fallbackUrl) {
            error_log(sprintf(
                '[db-failover] Primary DB connection failed (%s). Auto-failing over to FALLBACK_DATABASE_URL...',
                $primaryException->getMessage()
            ));
            try {
                $fallbackParams = parse_database_url_to_pdo_params($fallbackUrl);
                $pdo = connect_pdo_from_params($fallbackParams);
                $GLOBALS['active_database_tier'] = 'fallback';
                error_log('[db-failover] Successfully connected to FALLBACK_DATABASE_URL.');
                return $pdo;
            } catch (Throwable $fallbackException) {
                error_log('[db-failover] Fallback DB connection also failed: ' . $fallbackException->getMessage());
            }
        }

        throw $primaryException;
    }
}
