<?php

declare(strict_types=1);

namespace Src\Config\Domain\ValueObjects;

use Src\Config\Domain\Exceptions\InvalidSource;

/**
 * Display name of one job source (Stitch NAME field).
 *
 * Immutable and self-validating. Uniqueness per user is enforced by
 * the repository/database, not here: the VO only guarantees shape.
 */
final class SourceName
{
    public const MAX_LENGTH = 120;

    private function __construct(public readonly string $value) {}

    /**
     * @throws InvalidSource
     */
    public static function fromString(string $name): self
    {
        $name = trim($name);

        if ($name === '') {
            throw InvalidSource::blankValue('name');
        }

        if (mb_strlen($name) > self::MAX_LENGTH) {
            throw InvalidSource::tooLong('name', self::MAX_LENGTH);
        }

        return new self($name);
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
