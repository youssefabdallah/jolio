<?php

declare(strict_types=1);

namespace Src\Config\Domain\Exceptions;

use Src\Shared\Domain\Enums\ErrorCode;
use Src\Shared\Domain\Exceptions\DomainException;

/**
 * A Source aggregate or value object was assembled with data that
 * violates the registry rules (SPECS FR-38/FR-39, Stitch edit drawer).
 *
 * Translation keys live under config.errors.* (lang files land with the
 * Presentation layer; the Domain only names the keys).
 */
final class InvalidSource extends DomainException
{
    public static function blankValue(string $field): self
    {
        return new self(
            ErrorCode::InvalidSourceValue,
            'config.errors.blank_value',
            ['field' => $field],
        );
    }

    public static function tooLong(string $field, int $max): self
    {
        return new self(
            ErrorCode::InvalidSourceValue,
            'config.errors.too_long',
            ['field' => $field, 'max' => $max],
        );
    }

    public static function badUrl(string $field, string $value): self
    {
        return new self(
            ErrorCode::InvalidSourceValue,
            'config.errors.bad_url',
            ['field' => $field, 'value' => $value],
        );
    }

    public static function unknownLevel(string $field, string $value): self
    {
        return new self(
            ErrorCode::InvalidSourceValue,
            'config.errors.unknown_level',
            ['field' => $field, 'value' => $value],
        );
    }

    public static function invalidValue(string $field, string $value): self
    {
        return new self(
            ErrorCode::InvalidSourceValue,
            'config.errors.invalid_value',
            ['field' => $field, 'value' => $value],
        );
    }

    public static function nameTaken(string $name): self
    {
        return new self(
            ErrorCode::SourceTaken,
            'config.errors.name_taken',
            ['name' => $name],
        );
    }

    public static function urlTaken(string $url): self
    {
        return new self(
            ErrorCode::SourceTaken,
            'config.errors.url_taken',
            ['url' => $url],
        );
    }

    public static function notFound(string $id): self
    {
        return new self(
            ErrorCode::SourceNotFound,
            'config.errors.not_found',
            ['id' => $id],
        );
    }
}
