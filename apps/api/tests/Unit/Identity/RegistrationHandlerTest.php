<?php

declare(strict_types=1);

namespace Tests\Unit\Identity;

use PHPUnit\Framework\TestCase;
use Src\Identity\Application\Commands\HandleOAuthCallbackCommand;
use Src\Identity\Application\Commands\HandleOAuthCallbackHandler;
use Src\Identity\Application\Commands\LoginWithCredentialsCommand;
use Src\Identity\Application\Commands\LoginWithCredentialsHandler;
use Src\Identity\Application\Commands\RegisterWithCredentialsCommand;
use Src\Identity\Application\Commands\RegisterWithCredentialsHandler;
use Src\Identity\Application\Services\ApiTokenIssuer;
use Src\Identity\Application\Services\OAuthAccount;
use Src\Identity\Application\Services\OAuthUserGateway;
use Src\Identity\Application\Services\PasswordHasher;
use Src\Identity\Domain\Entities\User;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\Exceptions\EmailAlreadyTaken;
use Src\Identity\Domain\Exceptions\InvalidCredentials;
use Src\Identity\Domain\Repositories\UserRepository;
use Src\Identity\Domain\ValueObjects\Email;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Registration handlers enforce uniqueness and delegate to collaborators.
 */
final class RegistrationHandlerTest extends TestCase
{
    public function test_registers_with_credentials_and_issues_a_token(): void
    {
        $users = new InMemoryUserRepository;
        $handler = new RegisterWithCredentialsHandler(
            $users,
            new FixedPasswordHasher,
            new FixedTokenIssuer,
        );

        $result = $handler->handle(new RegisterWithCredentialsCommand(
            'Alex Dev',
            'alex@dev.internal',
            's3cret-pass',
            'tests',
        ));

        $this->assertTrue($result->user->isLocal());
        $this->assertSame('hashed:s3cret-pass', $result->user->passwordHash);
        $this->assertSame('token-for-'.((string) $result->user->id), $result->token);
        $this->assertTrue($users->existsByEmail(Email::fromString('alex@dev.internal')));
    }

    public function test_rejects_credentials_for_a_taken_email(): void
    {
        $users = new InMemoryUserRepository;
        $users->save(User::registerLocal(
            Ulid::generate(),
            Email::fromString('taken@dev.internal'),
            'Owner',
            'hash',
        ));
        $handler = new RegisterWithCredentialsHandler(
            $users,
            new FixedPasswordHasher,
            new FixedTokenIssuer,
        );

        $this->expectException(EmailAlreadyTaken::class);

        $handler->handle(new RegisterWithCredentialsCommand(
            'Someone Else',
            'taken@dev.internal',
            's3cret-pass',
            'tests',
        ));
    }

    public function test_signs_in_an_existing_oauth_user_without_duplicating(): void
    {
        $users = new InMemoryUserRepository;
        $existing = User::registerOAuth(
            Ulid::generate(),
            Email::fromString('alex@gmail.com'),
            'Alex Dev',
            AuthProvider::Google,
            'google-123',
        );
        $users->save($existing);

        $gateway = new FixedOAuthGateway(new OAuthAccount(
            AuthProvider::Google,
            'google-123',
            Email::fromString('alex@gmail.com'),
            'Alex Dev',
        ));
        $handler = new HandleOAuthCallbackHandler($users, $gateway, new FixedTokenIssuer);

        $result = $handler->handle(new HandleOAuthCallbackCommand(AuthProvider::Google, 'tests'));

        $this->assertSame((string) $existing->id, (string) $result->user->id);
        $this->assertSame(1, $users->count());
    }

    public function test_creates_the_oauth_user_on_first_sight(): void
    {
        $users = new InMemoryUserRepository;
        $gateway = new FixedOAuthGateway(new OAuthAccount(
            AuthProvider::Google,
            'google-999',
            Email::fromString('new@gmail.com'),
            'New User',
        ));
        $handler = new HandleOAuthCallbackHandler($users, $gateway, new FixedTokenIssuer);

        $result = $handler->handle(new HandleOAuthCallbackCommand(AuthProvider::Google, 'tests'));

        $this->assertFalse($result->user->isLocal());
        $this->assertSame('google-999', $result->user->providerId);
        $this->assertTrue($users->existsByEmail(Email::fromString('new@gmail.com')));
    }

    public function test_refuses_oauth_when_the_email_belongs_to_another_account(): void
    {
        $users = new InMemoryUserRepository;
        $users->save(User::registerLocal(
            Ulid::generate(),
            Email::fromString('alex@gmail.com'),
            'Alex Dev',
            'hash',
        ));
        $gateway = new FixedOAuthGateway(new OAuthAccount(
            AuthProvider::Google,
            'google-123',
            Email::fromString('alex@gmail.com'),
            'Alex Dev',
        ));
        $handler = new HandleOAuthCallbackHandler($users, $gateway, new FixedTokenIssuer);

        $this->expectException(EmailAlreadyTaken::class);

        $handler->handle(new HandleOAuthCallbackCommand(AuthProvider::Google, 'tests'));
    }

    public function test_signs_in_with_valid_credentials(): void
    {
        $users = new InMemoryUserRepository;
        $users->save(User::registerLocal(
            Ulid::generate(),
            Email::fromString('alex@dev.internal'),
            'Alex Dev',
            'hashed:s3cret-pass',
        ));
        $handler = new LoginWithCredentialsHandler($users, new FixedPasswordHasher, new FixedTokenIssuer);

        $result = $handler->handle(new LoginWithCredentialsCommand(
            'alex@dev.internal',
            's3cret-pass',
            'tests',
        ));

        $this->assertTrue($result->user->isLocal());
        $this->assertSame('token-for-'.((string) $result->user->id), $result->token);
    }

    public function test_rejects_an_unknown_email(): void
    {
        $handler = new LoginWithCredentialsHandler(
            new InMemoryUserRepository,
            new FixedPasswordHasher,
            new FixedTokenIssuer,
        );

        $this->expectException(InvalidCredentials::class);

        $handler->handle(new LoginWithCredentialsCommand('nobody@nowhere.dev', 'whatever', 'tests'));
    }

    public function test_rejects_a_wrong_password(): void
    {
        $users = new InMemoryUserRepository;
        $users->save(User::registerLocal(
            Ulid::generate(),
            Email::fromString('alex@dev.internal'),
            'Alex Dev',
            'hashed:s3cret-pass',
        ));
        $handler = new LoginWithCredentialsHandler($users, new FixedPasswordHasher, new FixedTokenIssuer);

        $this->expectException(InvalidCredentials::class);

        $handler->handle(new LoginWithCredentialsCommand('alex@dev.internal', 'wrong-pass', 'tests'));
    }

    public function test_rejects_password_login_for_oauth_only_accounts(): void
    {
        $users = new InMemoryUserRepository;
        $users->save(User::registerOAuth(
            Ulid::generate(),
            Email::fromString('alex@gmail.com'),
            'Alex Dev',
            AuthProvider::Google,
            'google-123',
        ));
        $handler = new LoginWithCredentialsHandler($users, new FixedPasswordHasher, new FixedTokenIssuer);

        $this->expectException(InvalidCredentials::class);

        $handler->handle(new LoginWithCredentialsCommand('alex@gmail.com', 'whatever', 'tests'));
    }
}

/**
 * In-memory UserRepository for handler tests (no database).
 */
final class InMemoryUserRepository implements UserRepository
{
    /** @var array<string, User> */
    private array $users = [];

    public function findById(Ulid $id): ?User
    {
        return $this->users[(string) $id] ?? null;
    }

    public function findByEmail(Email $email): ?User
    {
        foreach ($this->users as $user) {
            if ($user->email->equals($email)) {
                return $user;
            }
        }

        return null;
    }

    public function findByProvider(AuthProvider $provider, string $providerId): ?User
    {
        foreach ($this->users as $user) {
            if ($user->provider === $provider && $user->providerId === $providerId) {
                return $user;
            }
        }

        return null;
    }

    public function existsByEmail(Email $email): bool
    {
        return $this->findByEmail($email) !== null;
    }

    public function save(User $user): void
    {
        $this->users[(string) $user->id] = $user;
    }

    public function count(): int
    {
        return count($this->users);
    }
}

final class FixedPasswordHasher implements PasswordHasher
{
    public function hash(string $plain): string
    {
        return 'hashed:'.$plain;
    }

    public function verify(string $plain, string $hash): bool
    {
        return $hash === 'hashed:'.$plain;
    }
}

final class FixedTokenIssuer implements ApiTokenIssuer
{
    public function issueFor(Ulid $userId, string $deviceName): string
    {
        return 'token-for-'.((string) $userId);
    }
}

final class FixedOAuthGateway implements OAuthUserGateway
{
    public function __construct(private readonly OAuthAccount $account) {}

    public function redirectUrl(AuthProvider $provider): string
    {
        return 'https://provider.test/authorize';
    }

    public function userFromCallback(AuthProvider $provider): OAuthAccount
    {
        return $this->account;
    }
}
