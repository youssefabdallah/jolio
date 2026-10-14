<?php

declare(strict_types=1);

namespace Src\Identity\Application\Commands;

use Src\Identity\Application\DTOs\AuthenticatedUser;
use Src\Identity\Application\Services\ApiTokenIssuer;
use Src\Identity\Application\Services\OAuthUserGateway;
use Src\Identity\Domain\Entities\User;
use Src\Identity\Domain\Exceptions\EmailAlreadyTaken;
use Src\Identity\Domain\Exceptions\InvalidUser;
use Src\Identity\Domain\Exceptions\OAuthFailed;
use Src\Identity\Domain\Repositories\UserRepository;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Signs in with a verified OAuth account, creating the local user on
 * first sight (find-or-create by provider pair).
 *
 * Refuses with 409 when the email already belongs to a different
 * account: the caller learns an account exists, never which provider
 * owns it, and no credential is ever attached to the wrong identity.
 */
final readonly class HandleOAuthCallbackHandler
{
    public function __construct(
        private UserRepository $users,
        private OAuthUserGateway $gateway,
        private ApiTokenIssuer $tokens,
    ) {}

    /**
     * @throws EmailAlreadyTaken
     * @throws InvalidUser
     * @throws OAuthFailed
     */
    public function handle(HandleOAuthCallbackCommand $command): AuthenticatedUser
    {
        $account = $this->gateway->userFromCallback($command->provider);

        $user = $this->users->findByProvider($account->provider, $account->providerId);

        if ($user === null) {
            if ($this->users->existsByEmail($account->email)) {
                throw EmailAlreadyTaken::withEmail($account->email);
            }

            $user = User::registerOAuth(
                Ulid::generate(),
                $account->email,
                $account->displayName,
                $account->provider,
                $account->providerId,
                $account->avatarUrl,
            );

            $this->users->save($user);
        }

        return new AuthenticatedUser($user, $this->tokens->issueFor($user->id, $command->deviceName));
    }
}
