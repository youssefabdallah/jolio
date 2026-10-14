<?php

declare(strict_types=1);

namespace Src\Identity\Domain\Exceptions;

use Src\Shared\Domain\Enums\ErrorCode;
use Src\Shared\Domain\Exceptions\DomainException;

/**
 * Email/password authentication failed.
 *
 * One code and one message for both "unknown email" and "wrong password":
 * distinguishing them would let attackers enumerate registered addresses.
 */
final class InvalidCredentials extends DomainException
{
    public static function mismatch(): self
    {
        return new self(ErrorCode::InvalidCredentials, 'identity.errors.invalid_credentials');
    }
}
