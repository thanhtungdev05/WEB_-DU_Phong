<?php
declare(strict_types=1);

final class PostgresSessionHandler implements SessionHandlerInterface, SessionUpdateTimestampHandlerInterface
{
    private Closure $connectionFactory;
    private ?PDO $connection = null;

    public function __construct(callable $connectionFactory, private readonly int $ttlSeconds)
    {
        $this->connectionFactory = Closure::fromCallable($connectionFactory);
    }

    public function open(string $path, string $name): bool
    {
        return true;
    }

    public function close(): bool
    {
        return true;
    }

    public function read(string $id): string|false
    {
        $stmt = $this->db()->prepare(
            'SELECT data FROM app_sessions WHERE session_id_hash = :session_id_hash AND expires_at > NOW()'
        );
        $stmt->execute(['session_id_hash' => $this->hashId($id)]);
        $value = $stmt->fetchColumn();
        return $value === false ? '' : (string)$value;
    }

    public function write(string $id, string $data): bool
    {
        $stmt = $this->db()->prepare(
            'INSERT INTO app_sessions (session_id_hash, data, expires_at, created_at, updated_at)
             VALUES (:session_id_hash, :data, NOW() + make_interval(secs => CAST(:ttl_seconds AS INTEGER)), NOW(), NOW())
             ON CONFLICT (session_id_hash) DO UPDATE
             SET data = EXCLUDED.data,
                 expires_at = EXCLUDED.expires_at,
                 updated_at = NOW()'
        );
        return $stmt->execute([
            'session_id_hash' => $this->hashId($id),
            'data' => $data,
            'ttl_seconds' => $this->ttlSeconds,
        ]);
    }

    public function validateId(string $id): bool
    {
        $stmt = $this->db()->prepare(
            'SELECT 1 FROM app_sessions WHERE session_id_hash = :session_id_hash AND expires_at > NOW()'
        );
        $stmt->execute(['session_id_hash' => $this->hashId($id)]);
        return $stmt->fetchColumn() !== false;
    }

    public function updateTimestamp(string $id, string $data): bool
    {
        $stmt = $this->db()->prepare(
            'UPDATE app_sessions
                SET expires_at = NOW() + make_interval(secs => CAST(:ttl_seconds AS INTEGER)),
                    updated_at = NOW()
              WHERE session_id_hash = :session_id_hash
                AND expires_at > NOW()'
        );
        return $stmt->execute([
            'session_id_hash' => $this->hashId($id),
            'ttl_seconds' => $this->ttlSeconds,
        ]);
    }

    public function destroy(string $id): bool
    {
        $stmt = $this->db()->prepare('DELETE FROM app_sessions WHERE session_id_hash = :session_id_hash');
        return $stmt->execute(['session_id_hash' => $this->hashId($id)]);
    }

    public function gc(int $max_lifetime): int|false
    {
        $stmt = $this->db()->prepare('DELETE FROM app_sessions WHERE expires_at <= NOW()');
        $stmt->execute();
        return $stmt->rowCount();
    }

    private function db(): PDO
    {
        if (!$this->connection instanceof PDO) {
            $this->connection = ($this->connectionFactory)();
        }
        return $this->connection;
    }

    private function hashId(string $id): string
    {
        return hash('sha256', $id);
    }
}
