<?php

declare(strict_types=1);

namespace Src\Identity\Domain\Entities;

use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\Exceptions\InvalidUser;
use Src\Identity\Domain\ValueObjects\Email;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Identity aggregate root (SPECS §6 User: id, email, display name,
 * auth provider, created at).
 *
 * Invariants enforced here, never in callers:
 * - display name is never blank;
 * - local users always carry a password hash;
 * - OAuth users always carry a provider id, never a local password hash,
 *   and never use the local provider.
 */
final class User
{
    private function __construct(
        public readonly Ulid $id,
        public readonly Email $email,
        public readonly string $displayName,
        public readonly AuthProvider $provider,
        public readonly ?string $passwordHash,
        public readonly ?string $providerId,
        public readonly ?string $avatarUrl,
    ) {}

    /**
     * Register a user authenticating with email/password (SPECS FR-1).
     *
     * @param  non-empty-string  $passwordHash  Already-hashed credential (FR-3).
     *
     * @throws InvalidUser
     */
    public static function registerLocal(
        Ulid $id,
        Email $email,
        string $displayName,
        string $passwordHash,
        ?string $avatarUrl = null,
    ): self {
        if (trim($displayName) === '') {
            throw InvalidUser::blankDisplayName();
        }

        if (trim($passwordHash) === '') {
            throw InvalidUser::localWithoutPassword();
        }

        return new self($id, $email, $displayName, AuthProvider::Local, $passwordHash, null, $avatarUrl);
    }

    /**
     * Register a user vouched for by an external OAuth provider (SPECS FR-1).
     *
     * @throws InvalidUser
     */
    public static function registerOAuth(
        Ulid $id,
        Email $email,
        string $displayName,
        AuthProvider $provider,
        string $providerId,
        ?string $avatarUrl = null,
    ): self {
        if (trim($displayName) === '') {
            throw InvalidUser::blankDisplayName();
        }

        if (! $provider->isOAuth()) {
            throw InvalidUser::oauthWithLocalProvider();
        }

        if (trim($providerId) === '') {
            throw InvalidUser::oauthWithoutProviderId();
        }

        return new self($id, $email, $displayName, $provider, null, $providerId, $avatarUrl);
    }

    /**
     * Whether this user authenticates with a local password.
     */
    public function isLocal(): bool
    {
        return ! $this->provider->isOAuth();
    }
}
