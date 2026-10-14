<?php

declare(strict_types=1);

namespace Tests\Feature\Identity;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Src\Identity\Domain\Entities\User as DomainUser;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\ValueObjects\Email;
use Src\Identity\Infrastructure\Persistence\Eloquent\EloquentUserRepository;
use Src\Identity\Infrastructure\Persistence\Eloquent\User as EloquentUser;
use Src\Shared\Domain\ValueObjects\Ulid;
use Tests\TestCase;

/**
 * The Eloquent repository persists and rebuilds the Identity aggregate.
 */
final class EloquentUserRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentUserRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new EloquentUserRepository;
    }

    public function test_saves_and_finds_a_local_user_by_id(): void
    {
        $user = DomainUser::registerLocal(
            Ulid::generate(),
            Email::fromString('alex@dev.internal'),
            'Alex Dev',
            'hashed-secret',
        );

        $this->repository->save($user);
        $found = $this->repository->findById($user->id);

        $this->assertNotNull($found);
        $this->assertSame((string) $user->id, (string) $found->id);
        $this->assertTrue($found->email->equals($user->email));
        $this->assertSame('Alex Dev', $found->displayName);
        $this->assertSame(AuthProvider::Local, $found->provider);
    }

    public function test_saves_and_finds_an_oauth_user_by_email(): void
    {
        $user = DomainUser::registerOAuth(
            Ulid::generate(),
            Email::fromString('alex@gmail.com'),
            'Alex Dev',
            AuthProvider::Google,
            'google-123',
        );

        $this->repository->save($user);
        $found = $this->repository->findByEmail(Email::fromString('alex@gmail.com'));

        $this->assertNotNull($found);
        $this->assertSame('google-123', $found->providerId);
        $this->assertNull($found->passwordHash);
    }

    public function test_returns_null_for_unknown_ids_and_emails(): void
    {
        $this->assertNull($this->repository->findById(Ulid::generate()));
        $this->assertNull($this->repository->findByEmail(Email::fromString('nobody@nowhere.dev')));
        $this->assertFalse($this->repository->existsByEmail(Email::fromString('nobody@nowhere.dev')));
    }

    public function test_rejects_a_duplicate_email(): void
    {
        EloquentUser::factory()->create(['email' => 'taken@dev.internal']);

        $this->expectException(QueryException::class);

        $this->repository->save(DomainUser::registerLocal(
            Ulid::generate(),
            Email::fromString('taken@dev.internal'),
            'Someone Else',
            'hash',
        ));
    }

    public function test_rejects_a_duplicate_provider_pair(): void
    {
        EloquentUser::factory()->oauth()->create([
            'email' => 'first@gmail.com',
            'provider_id' => 'google-123',
        ]);

        $this->expectException(QueryException::class);

        $this->repository->save(DomainUser::registerOAuth(
            Ulid::generate(),
            Email::fromString('second@gmail.com'),
            'Second',
            AuthProvider::Google,
            'google-123',
        ));
    }
}
