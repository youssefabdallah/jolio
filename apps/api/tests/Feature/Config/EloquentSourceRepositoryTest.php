<?php

declare(strict_types=1);

namespace Tests\Feature\Config;

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Src\Config\Domain\Entities\Source as DomainSource;
use Src\Config\Domain\Enums\SourcePriority;
use Src\Config\Domain\Enums\SourceType;
use Src\Config\Domain\ValueObjects\CountryCode;
use Src\Config\Domain\ValueObjects\SourceName;
use Src\Config\Domain\ValueObjects\SourceUrl;
use Src\Config\Infrastructure\Persistence\Eloquent\EloquentSourceRepository;
use Src\Identity\Infrastructure\Persistence\Eloquent\User;
use Src\Shared\Domain\ValueObjects\Ulid;
use Tests\TestCase;

/**
 * The Eloquent repository persists and rebuilds the Source aggregate
 * with owner scoping and per-user uniqueness.
 */
final class EloquentSourceRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private EloquentSourceRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = new EloquentSourceRepository;
    }

    public function test_saves_and_finds_a_source_by_id(): void
    {
        $userId = $this->ownerId();
        $source = $this->makeSource($userId);

        $this->repository->save($source);
        $found = $this->repository->findById($source->id);

        $this->assertNotNull($found);
        $this->assertSame((string) $source->id, (string) $found->id);
        $this->assertSame('Arbeitnow', (string) $found->name);
        $this->assertSame(SourceType::SearchEngine, $found->type);
        $this->assertSame(SourcePriority::T2, $found->priority);
    }

    public function test_scopes_lookups_to_the_owner(): void
    {
        $userId = $this->ownerId();
        $source = $this->makeSource($userId);

        $this->repository->save($source);

        $this->assertNull($this->repository->findByIdForUser($source->id, Ulid::generate()));
        $this->assertNotNull($this->repository->findByIdForUser($source->id, $userId));
        $this->assertSame([], $this->repository->listForUser(Ulid::generate()));
    }

    public function test_rejects_a_duplicate_name_or_url_for_the_same_user(): void
    {
        $userId = $this->ownerId();
        $source = $this->makeSource($userId);

        $this->repository->save($source);

        $this->assertTrue($this->repository->existsForUserWithName($userId, 'arbeitnow'));
        $this->assertTrue($this->repository->existsForUserWithUrl($userId, (string) $source->url));
        $this->assertFalse($this->repository->existsForUserWithName($this->ownerId(), 'Arbeitnow'));

        $this->expectException(QueryException::class);

        $this->repository->save($this->makeSource(
            $userId,
            'Arbeitnow',
            'https://www.arbeitnow.com/api/job-board-api',
        ));
    }

    public function test_allows_the_same_name_for_a_different_user(): void
    {
        $source = $this->makeSource($this->ownerId());

        $this->repository->save($source);
        $this->repository->save($this->makeSource(
            $this->ownerId(),
            'Arbeitnow',
            'https://www.arbeitnow.com/api/job-board-api',
        ));

        $this->assertTrue(true);
    }

    /**
     * Sources belong to a real user row (FK with cascade on delete),
     * so tests mint an owner the same way the profile suite does.
     */
    private function ownerId(): Ulid
    {
        return Ulid::fromString((string) User::factory()->create()->getKey());
    }

    private function makeSource(
        Ulid $userId,
        string $name = 'Arbeitnow',
        string $url = 'https://www.arbeitnow.com/api/job-board-api',
    ): DomainSource {
        return DomainSource::fromParts(
            Ulid::generate(),
            $userId,
            SourceName::fromString($name),
            SourceUrl::fromString($url),
            SourceType::SearchEngine,
            SourcePriority::T2,
            CountryCode::fromString('DE'),
        );
    }
}
