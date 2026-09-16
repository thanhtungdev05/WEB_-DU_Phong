<?php
declare(strict_types=1);

function iam_nested_claim(array $profile, string $key): mixed
{
    $value = $profile;
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return null;
        }
        $value = $value[$part];
    }
    return $value;
}
function iam_claim_string(array $profile, array $keys): ?string
{
    foreach ($keys as $key) {
        $value = iam_nested_claim($profile, $key);
        if (is_array($value)) {
            $value = reset($value);
        }
        if (is_scalar($value)) {
            $text = trim((string)$value);
            if ($text !== '') {
                return $text;
            }
        }
    }
    return null;
}

function iam_normalize_employee_id(?string $value): ?string
{
    if (!$value) {
        return null;
    }
    $value = trim($value);
    if (str_contains($value, '@')) {
        $value = explode('@', $value, 2)[0];
    }
    $value = preg_replace('/\s+/', '', $value) ?? '';
    return $value !== '' ? strtoupper($value) : null;
}

function iam_profile_email(array $profile, ?string $employeeId, string $fallbackDomain): string
{
    $email = iam_claim_string($profile, ['email', 'mail', 'userPrincipalName', 'upn', 'preferred_username']);
    if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return strtolower(trim($email));
    }

    if (!$employeeId) {
        throw new InvalidArgumentException('IAM did not return a valid email or an explicit employee_id.');
    }

    $domain = strtolower(trim($fallbackDomain, '@ '));
    if ($domain === '') {
        throw new InvalidArgumentException('IAM fallback email domain is invalid.');
    }
    return strtolower($employeeId) . '@' . $domain;
}

function iam_profile_display_name(array $profile): ?string
{
    $given = iam_claim_string($profile, ['given_name', 'givenName']);
    $family = iam_claim_string($profile, ['family_name', 'familyName']);
    if ($given !== null && $family !== null) {
        // OpenID Connect defines family_name as the surname and given_name as
        // the remaining personal name. Vietnamese displays use surname first.
        return trim($family . ' ' . $given);
    }

    $name = iam_claim_string($profile, ['name', 'displayName', 'display_name', 'fullName', 'full_name']);
    if ($name) {
        return $name;
    }

    return $family ?? $given;
}

function iam_identity_from_profile(array $profile, string $fallbackDomain): array
{
    $employeeId = iam_normalize_employee_id(iam_claim_string($profile, [
        'employee_id',
        'employeeId',
        'employee_number',
        'employeeNumber',
        'staff_id',
        'staffId',
        'staff_code',
        'staffCode',
        'attributes.employee_id',
        'attributes.employeeId',
        'attributes.employee_number',
        'attributes.employeeNumber',
        'attributes.staff_id',
        'attributes.staffId',
    ]));

    $subject = iam_claim_string($profile, ['sub', 'oid', 'id']);
    if (!$subject) {
        throw new InvalidArgumentException('IAM did not return a stable subject identifier.');
    }

    return [
        'employee_id' => $employeeId,
        'email' => iam_profile_email($profile, $employeeId, $fallbackDomain),
        'subject' => $subject,
        'display_name' => iam_profile_display_name($profile),
    ];
}
