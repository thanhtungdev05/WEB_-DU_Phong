<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/api/lib/iam_identity.php';

function iam_identity_expect(mixed $expected, mixed $actual, string $message): void
{
    if ($expected !== $actual) {
        throw new RuntimeException($message . "\nExpected: " . json_encode($expected, JSON_UNESCAPED_UNICODE)
            . "\nActual: " . json_encode($actual, JSON_UNESCAPED_UNICODE));
    }
}

try {
    iam_identity_expect(
        'Nguyễn Tuấn Anh',
        iam_profile_display_name([
            'name' => 'Tuấn Anh Nguyễn',
            'given_name' => 'Tuấn Anh',
            'family_name' => 'Nguyễn',
        ]),
        'Standard IAM name claims must be displayed in Vietnamese surname-first order.',
    );
    iam_identity_expect(
        'Trần Đăng Cảnh',
        iam_profile_display_name([
            'displayName' => 'Đăng Cảnh Trần',
            'givenName' => 'Đăng Cảnh',
            'familyName' => 'Trần',
        ]),
        'Camel-case IAM name claims must use surname-first order.',
    );
    iam_identity_expect(
        'Tên IAM nguyên bản',
        iam_profile_display_name(['name' => 'Tên IAM nguyên bản']),
        'The combined IAM name must remain a fallback when structured claims are absent.',
    );
    iam_identity_expect(
        'Nguyễn',
        iam_profile_display_name(['family_name' => 'Nguyễn']),
        'A single structured name claim must remain usable.',
    );

    $apiSource = file_get_contents(dirname(__DIR__) . '/api/index.php');
    if (!is_string($apiSource)
        || !str_contains($apiSource, 'WHEN employee_source IS NOT NULL THEN COALESCE(display_name, :roster_display_name)')) {
        throw new RuntimeException('IAM login must not overwrite a roster display name imported from Excel.');
    }

    $readOnlySessionSource = file_get_contents(dirname(__DIR__) . '/api/index.php');
    if (!is_string($readOnlySessionSource)
        || !str_contains($readOnlySessionSource, '[\'dev\', \'iam\', \'auth\']')) {
        throw new RuntimeException('IAM login and callback must never run from a read-and-close session; oauth2state writes would be lost.');
    }

    if (!str_contains($apiSource, 'function fail_or_redirect_iam_callback(int $status, string $code, string $message): void')
        || !str_contains($apiSource, '$existingUser = find_active_session_user();')
        || !str_contains($apiSource, 'redirect_to(iam_post_login_url($existingUser));')
        || !str_contains($apiSource, 'redirect_to(iam_login_page_url($code));')
        || !str_contains($apiSource, '!hash_equals($expectedState, $state)')) {
        throw new RuntimeException('IAM callback must redirect active sessions to portal.html and browser navigations to login/index.html when state is replayed.');
    }

    $indexHtml = file_get_contents(dirname(__DIR__) . '/index.html');
    if (!is_string($indexHtml)
        || !str_contains($indexHtml, 'ftc_consumed_iam_state')
        || !str_contains($indexHtml, 'window.history.replaceState')
        || !str_contains($indexHtml, "alreadyConsumedCallback ? 'portal.html'")) {
        throw new RuntimeException('index.html must scrub OAuth callback query parameters and redirect replayed states to portal.html.');
    }

    $portalHtml = file_get_contents(dirname(__DIR__) . '/portal.html');
    if (!is_string($portalHtml)
        || !str_contains($portalHtml, 'oauthParams.delete(\'state\')')
        || !str_contains($portalHtml, 'window.history.replaceState({}, document.title, cleanUrl)')) {
        throw new RuntimeException('portal.html must strip OAuth callback query parameters from browser history.');
    }

    fwrite(STDOUT, "IAM identity name-order tests passed.\n");
} catch (Throwable $exception) {
    fwrite(STDERR, $exception->getMessage() . "\n");
    exit(1);
}
