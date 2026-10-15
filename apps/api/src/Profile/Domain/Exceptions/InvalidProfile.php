<?php

declare(strict_types=1);

namespace Src\Profile\Domain\Exceptions;

use Src\Shared\Domain\Enums\ErrorCode;
use Src\Shared\Domain\Exceptions\DomainException;

/**
 * A Profile aggregate or value object was assembled with data that
 * violates the candidate-truth rules (SPECS FR-4/FR-5).
 */
final class InvalidProfile extends DomainException
{
    public static function blankValue(string $field): self
    {
        return new self(
            ErrorCode::InvalidProfileValue,
            'profile.errors.blank_value',
            ['field' => $field],
        );
    }

    public static function tooLong(string $field, int $max): self
    {
        return new self(
            ErrorCode::InvalidProfileValue,
            'profile.errors.too_long',
            ['field' => $field, 'max' => $max],
        );
    }

    public static function badDate(string $field, string $value): self
    {
        return new self(
            ErrorCode::InvalidProfileValue,
            'profile.errors.bad_date',
            ['field' => $field, 'value' => $value],
        );
    }

    public static function badEmail(string $value): self
    {
        return new self(
            ErrorCode::InvalidProfileValue,
            'profile.errors.bad_email',
            ['value' => $value],
        );
    }

    public static function badUrl(string $field, string $value): self
    {
        return new self(
            ErrorCode::InvalidProfileValue,
            'profile.errors.bad_url',
            ['field' => $field, 'value' => $value],
        );
    }

    public static function endBeforeStart(string $field): self
    {
        return new self(
            ErrorCode::InvalidProfileValue,
            'profile.errors.end_before_start',
            ['field' => $field],
        );
    }

    public static function unknownLevel(string $field, string $value): self
    {
        return new self(
            ErrorCode::InvalidProfileValue,
            'profile.errors.unknown_level',
            ['field' => $field, 'value' => $value],
        );
    }

    public static function tooMany(string $field, int $max): self
    {
        return new self(
            ErrorCode::InvalidProfileValue,
            'profile.errors.too_many',
            ['field' => $field, 'max' => $max],
        );
    }
}
