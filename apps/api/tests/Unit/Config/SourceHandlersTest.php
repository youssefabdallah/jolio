<?php

declare(strict_types=1);

namespace Tests\Unit\Config;

use PHPUnit\Framework\TestCase;
use Src\Config\Application\Commands\CreateSourceCommand;
use Src\Config\Application\Commands\CreateSourceHandler;
use Src\Config\Application\Commands\DeleteSourceCommand;
use Src\Config\Application\Commands\DeleteSourceHandler;
use Src\Config\Application\Commands\UpdateSourceCommand;
use Src\Config\Application\Commands\UpdateSourceHandler;
use Src\Config\Domain\Entities\Source;
use Src\Config\Domain\Enums\SourcePriority;
use Src\Config\Domain\Enums\SourceType;
use Src\Config\Domain\Exceptions\InvalidSource;
use Src\Config\Domain\Repositories\SourceRepository;
use Src\Shared\Domain\Enums\ErrorCode;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Array-backed SourceRepository double: handlers run with no database.
 */
final class InMemorySourceRepository implements SourceRepository
{
    /** @var array<string, Source> */
    private array $rows = [];

    public function findById(Ulid $id): ?Source
    {
        return $this->rows[(string) $id] ?? null;
    }

    public function findByIdForUser(Ulid $id, Ulid $userId): ?Source
    {
        $found = $this->findById($id);

        return $found !== null && (string) $found->userId === (string) $userId ? $found : null;
    }

    public function listForUser(Ulid $userId): array
    {
        return array_values(array_filter(
            $this->rows,
            fn (Source $source): bool => (string) $source->userId === (string) $userId
        ));
    }

    public function existsForUserWithName(Ulid $userId, string $name, ?Ulid $ignoreId = null): bool
    {
        foreach ($this->listForUser($userId) as $source) {
            if ($ignoreId !== null && (string) $source->id === (string) $ignoreId) {
                continue;
            }

            if (mb_strtolower((string) $source->name) === mb_strtolower(trim($name))) {
                return true;
            }
        }

        return false;
    }

    public function existsForUserWithUrl(Ulid $userId, string $url, ?Ulid $ignoreId = null): bool
    {
        foreach ($this->listForUser($userId) as $source) {
            if ($ignoreId !== null && (string) $source->id === (string) $ignoreId) {
                continue;
            }

            if ((string) $source->url === trim($url)) {
                return true;
            }
        }

        return false;
    }

    public function save(Source $source): void
    {
        $this->rows[(string) $source->id] = $source;
    }

    public function delete(Source $source): void
    {
        unset($this->rows[(string) $source->id]);
    }
}

/**
 * Source command handlers enforce shape, ownership, and per-user
 * uniqueness without touching a database.
 */
final class SourceHandlersTest extends TestCase
{
    public function test_create_persists_a_valid_source(): void
    {
        $sources = new InMemorySourceRepository;
        $handler = new CreateSourceHandler($sources);
        $userId = Ulid::generate();

        $source = $handler->handle(new CreateSourceCommand(
            userId: $userId,
            name: 'Arbeitnow',
            url: 'https://www.arbeitnow.com/api/job-board-api',
            type: 'search_engine',
            priority: 't2',
            countryCode: 'de',
            isEnabled: true,
        ));

        $this->assertSame('Arbeitnow', (string) $source->name);
        $this->assertSame(SourceType::SearchEngine, $source->type);
        $this->assertSame(SourcePriority::T2, $source->priority);
        $this->assertSame('DE', (string) $source->country);
        $this->assertNotNull($sources->findById($source->id));
    }

    public function test_create_rejects_a_duplicate_name_as_conflict(): void
    {
        $sources = new InMemorySourceRepository;
        $handler = new CreateSourceHandler($sources);
        $userId = Ulid::generate();

        $handler->handle($this->createCommand($userId));

        try {
            $handler->handle($this->createCommand($userId, name: 'ARBEITNOW'));
            $this->fail('Expected a name-taken conflict.');
        } catch (InvalidSource $e) {
            $this->assertSame(ErrorCode::SourceTaken, $e->errorCode);
            $this->assertSame(409, $e->errorCode->httpStatus());
        }
    }

    public function test_create_rejects_a_non_https_url(): void
    {
        $handler = new CreateSourceHandler(new InMemorySourceRepository);

        $this->expectException(InvalidSource::class);

        $handler->handle($this->createCommand(Ulid::generate(), url: 'http://example.com/feed'));
    }

    public function test_update_replaces_and_ignores_itself_in_collision_checks(): void
    {
        $sources = new InMemorySourceRepository;
        $userId = Ulid::generate();
        $created = (new CreateSourceHandler($sources))->handle($this->createCommand($userId));

        $updated = (new UpdateSourceHandler($sources))->handle(new UpdateSourceCommand(
            id: $created->id,
            userId: $userId,
            name: 'Arbeitnow',
            url: 'https://www.arbeitnow.com/api/job-board-api',
            type: 'board',
            priority: 'T1',
            countryCode: 'GLOBAL',
            isEnabled: false,
        ));

        $this->assertSame((string) $created->id, (string) $updated->id);
        $this->assertSame(SourceType::Board, $updated->type);
        $this->assertFalse($updated->isEnabled);
    }

    public function test_update_answers_404_for_missing_or_foreign_rows(): void
    {
        $sources = new InMemorySourceRepository;
        $handler = new UpdateSourceHandler($sources);
        $created = (new CreateSourceHandler($sources))->handle($this->createCommand(Ulid::generate()));

        foreach ([Ulid::generate(), $created->id] as $id) {
            try {
                $handler->handle(new UpdateSourceCommand(
                    id: $id,
                    userId: Ulid::generate(),
                    name: 'X',
                    url: 'https://example.com/x',
                    type: 'board',
                    priority: 'T1',
                    countryCode: 'GLOBAL',
                ));
                $this->fail('Expected a 404 not-found.');
            } catch (InvalidSource $e) {
                $this->assertSame(ErrorCode::SourceNotFound, $e->errorCode);
                $this->assertSame(404, $e->errorCode->httpStatus());
            }
        }
    }

    public function test_delete_removes_and_404s_foreign_rows(): void
    {
        $sources = new InMemorySourceRepository;
        $userId = Ulid::generate();
        $created = (new CreateSourceHandler($sources))->handle($this->createCommand($userId));

        (new DeleteSourceHandler($sources))->handle(new DeleteSourceCommand($created->id, $userId));
        $this->assertNull($sources->findById($created->id));

        $this->expectException(InvalidSource::class);
        (new DeleteSourceHandler($sources))->handle(new DeleteSourceCommand($created->id, $userId));
    }

    private function createCommand(Ulid $userId, string $name = 'Arbeitnow', string $url = 'https://www.arbeitnow.com/api/job-board-api'): CreateSourceCommand
    {
        return new CreateSourceCommand(
            userId: $userId,
            name: $name,
            url: $url,
            type: 'search_engine',
            priority: 'T2',
            countryCode: 'GLOBAL',
        );
    }
}
