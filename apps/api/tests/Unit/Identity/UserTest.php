<?php

declare(strict_types=1);

namespace Tests\Unit\Identity;

use PHPUnit\Framework\TestCase;
use Src\Identity\Domain\Entities\User;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\Exceptions\InvalidUser;
use Src\Identity\Domain\ValueObjects\Email;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * The User aggregate cannot be assembled in a rule-breaking state.
 */
final class UserTest extends TestCase
{
    public function test_registers_a_local_user(): void
    {
        $user = User::registerLocal(
            Ulid::generate(),
            Email::fromString('alex@dev.internal'),
            'Alex Dev',
            'hashed-secret',
        );

        $this->assertTrue($user->isLocal());
        $this->assertSame(AuthProvider::Local, $user->provider);
        $this->assertNull($user->providerId);
    }

    public function test_registers_an_oauth_user(): void
    {
        $user = User::registerOAuth(
            Ulid::generate(),
            Email::fromString('alex@gmail.com'),
            'Alex Dev',
            AuthProvider::Google,
            'google-123',
        );

        $this->assertFalse($user->isLocal());
        $this->assertNull($user->passwordHash);
    }

    public function test_rejects_a_local_user_without_password(): void
    {
        $this->expectException(InvalidUser::class);

        User::registerLocal(Ulid::generate(), Email::fromString('a@b.co'), 'Alex', '');
    }

    public function test_rejects_a_blank_display_name(): void
    {
        $this->expectException(InvalidUser::class);

        User::registerLocal(Ulid::generate(), Email::fromString('a@b.co'), '  ', 'hash');
    }

    public function test_rejects_oauth_with_the_local_provider(): void
    {
        $this->expectException(InvalidUser::class);

        User::registerOAuth(
            Ulid::generate(),
            Email::fromString('a@b.co'),
            'Alex',
            AuthProvider::Local,
            'whatever',
        );
    }

    public function test_rejects_oauth_without_a_provider_id(): void
    {
        $this->expectException(InvalidUser::class);

        User::registerOAuth(
            Ulid::generate(),
            Email::fromString('a@b.co'),
            'Alex',
            AuthProvider::Google,
            '',
        );
    }
}
