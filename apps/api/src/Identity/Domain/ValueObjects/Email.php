<?php

declare(strict_types=1);

namespace Src\Identity\Domain\ValueObjects;

use Src\Identity\Domain\Exceptions\InvalidUser;

/**
 * Self-validating email address value object.
 */
final class Email
{
    private function __construct(private readonly string $value) {}

    /**
     * @throws InvalidUser
     */
    public static function fromString(string $value): self
    {
        $normalized = strtolower(trim($value));

        if ($normalized === '' || filter_var($normalized, FILTER_VALIDATE_EMAIL) === false) {
            throw InvalidUser::invalidEmail($value);
        }

        return new self($normalized);
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
