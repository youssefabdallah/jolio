<?php

declare(strict_types=1);

namespace Src\Identity\Domain\Exceptions;

use Src\Identity\Domain\ValueObjects\Email;
use Src\Shared\Domain\Enums\ErrorCode;
use Src\Shared\Domain\Exceptions\DomainException;

/**
 * Registration was attempted with an email address that already exists.
 *
 * Deliberately the same response whether the existing account is local or
 * OAuth: the caller learns nothing about which provider owns the address.
 */
final class EmailAlreadyTaken extends DomainException
{
    public static function withEmail(Email $email): self
    {
        return new self(
            ErrorCode::EmailTaken,
            'identity.errors.email_taken',
            ['email' => (string) $email],
        );
    }
}
