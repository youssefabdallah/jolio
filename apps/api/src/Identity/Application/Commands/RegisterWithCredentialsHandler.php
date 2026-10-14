<?php

declare(strict_types=1);

namespace Src\Identity\Application\Commands;

use Src\Identity\Application\DTOs\AuthenticatedUser;
use Src\Identity\Application\Services\ApiTokenIssuer;
use Src\Identity\Application\Services\PasswordHasher;
use Src\Identity\Domain\Entities\User;
use Src\Identity\Domain\Exceptions\EmailAlreadyTaken;
use Src\Identity\Domain\Exceptions\InvalidUser;
use Src\Identity\Domain\Repositories\UserRepository;
use Src\Identity\Domain\ValueObjects\Email;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Creates a local-credential account and signs it in.
 *
 * The email uniqueness check here is a fast-path with a clear 409; the
 * database unique constraint remains the final arbiter under races.
 */
final readonly class RegisterWithCredentialsHandler
{
    public function __construct(
        private UserRepository $users,
        private PasswordHasher $hasher,
        private ApiTokenIssuer $tokens,
    ) {}

    /**
     * @throws EmailAlreadyTaken
     * @throws InvalidUser
     */
    public function handle(RegisterWithCredentialsCommand $command): AuthenticatedUser
    {
        $email = Email::fromString($command->email);

        if ($this->users->existsByEmail($email)) {
            throw EmailAlreadyTaken::withEmail($email);
        }

        $user = User::registerLocal(
            Ulid::generate(),
            $email,
            $command->displayName,
            $this->hasher->hash($command->password),
        );

        $this->users->save($user);

        return new AuthenticatedUser($user, $this->tokens->issueFor($user->id, $command->deviceName));
    }
}
