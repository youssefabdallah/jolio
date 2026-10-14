<?php

declare(strict_types=1);

namespace Src\Identity\Application\Commands;

use Src\Identity\Application\DTOs\AuthenticatedUser;
use Src\Identity\Application\Services\ApiTokenIssuer;
use Src\Identity\Application\Services\PasswordHasher;
use Src\Identity\Domain\Exceptions\InvalidCredentials;
use Src\Identity\Domain\Exceptions\InvalidUser;
use Src\Identity\Domain\Repositories\UserRepository;
use Src\Identity\Domain\ValueObjects\Email;

/**
 * Authenticates a local credential and signs it in.
 *
 * Unknown emails, OAuth-only accounts (no local hash), and wrong
 * passwords all fail identically: callers learn nothing about which
 * part was wrong.
 */
final readonly class LoginWithCredentialsHandler
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private ApiTokenIssuer $tokens,
    ) {}

    /**
     * @throws InvalidCredentials
     * @throws InvalidUser
     */
    public function handle(LoginWithCredentialsCommand $command): AuthenticatedUser
    {
        $user = $this->users->findByEmail(Email::fromString($command->email));

        if ($user === null
            || $user->passwordHash === null
            || ! $this->hasher->verify($command->password, $user->passwordHash)
        ) {
            throw InvalidCredentials::mismatch();
        }

        return new AuthenticatedUser($user, $this->tokens->issueFor($user->id, $command->deviceName));
    }
}
