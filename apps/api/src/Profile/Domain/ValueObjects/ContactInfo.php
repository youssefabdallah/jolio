<?php

declare(strict_types=1);

namespace Src\Profile\Domain\ValueObjects;

use Src\Profile\Domain\Exceptions\InvalidProfile;

/**
 * Contact block of a candidate profile (SPECS §6 Profile).
 *
 * Immutable and self-validating. Email is checked locally with
 * filter_var rather than reusing Identity's Email object: Domain
 * objects never cross bounded-context boundaries.
 */
final class ContactInfo
{
    public const MAX_NAME = 120;

    public const MAX_FIELD = 120;

    public const MAX_WEBSITE = 2048;

    private function __construct(
        public readonly string $fullName,
        public readonly ?string $email,
        public readonly ?string $phone,
        public readonly ?string $city,
        public readonly ?string $country,
        public readonly ?string $website,
    ) {}

    /**
     * @throws InvalidProfile
     */
    public static function fromPrimitives(
        string $fullName,
        ?string $email = null,
        ?string $phone = null,
        ?string $city = null,
        ?string $country = null,
        ?string $website = null,
    ): self {
        $fullName = trim($fullName);
        if ($fullName === '') {
            throw InvalidProfile::blankValue('contact.full_name');
        }
        if (mb_strlen($fullName) > self::MAX_NAME) {
            throw InvalidProfile::tooLong('contact.full_name', self::MAX_NAME);
        }

        $email = self::nullIfBlank($email);
        if ($email !== null && filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            throw InvalidProfile::badEmail($email);
        }

        foreach (['contact.phone' => $phone, 'contact.city' => $city, 'contact.country' => $country] as $field => $value) {
            $value = self::nullIfBlank($value);
            if ($value !== null && mb_strlen($value) > self::MAX_FIELD) {
                throw InvalidProfile::tooLong($field, self::MAX_FIELD);
            }
        }

        $website = self::nullIfBlank($website);
        if ($website !== null) {
            if (mb_strlen($website) > self::MAX_WEBSITE) {
                throw InvalidProfile::tooLong('contact.website', self::MAX_WEBSITE);
            }
            $scheme = (string) parse_url($website, PHP_URL_SCHEME);
            if ($scheme !== 'http' && $scheme !== 'https') {
                throw InvalidProfile::badUrl('contact.website', $website);
            }
        }

        return new self(
            $fullName,
            $email,
            self::nullIfBlank($phone),
            self::nullIfBlank($city),
            self::nullIfBlank($country),
            $website,
        );
    }

    private static function nullIfBlank(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }
}
