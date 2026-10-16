<?php

declare(strict_types=1);

namespace Src\Config\Domain\ValueObjects;

use Src\Config\Domain\Exceptions\InvalidSource;

/**
 * Optional country scope of one job source (Stitch COUNTRY field).
 *
 * Stored NOT NULL per approved schema: omitted or blank input becomes
 * GLOBAL (worldwide) instead of NULL, so run queries never need
 * three-state logic. Otherwise an ISO-3166-1 alpha-2 code (DE, US).
 * Full country-name validation lives at the form layer; the Domain
 * only enforces the code shape.
 */
final class CountryCode
{
    public const GLOBAL = 'GLOBAL';

    private function __construct(public readonly string $value) {}

    /**
     * @throws InvalidSource
     */
    public static function fromString(?string $code): self
    {
        $normalized = strtoupper(trim($code ?? ''));

        if ($normalized === '' || $normalized === self::GLOBAL) {
            return new self(self::GLOBAL);
        }

        if (preg_match('/^[A-Z]{2}$/', $normalized) !== 1) {
            throw InvalidSource::invalidValue('country_code', (string) $code);
        }

        return new self($normalized);
    }

    public function isGlobal(): bool
    {
        return $this->value === self::GLOBAL;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
