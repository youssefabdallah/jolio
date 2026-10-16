<?php

declare(strict_types=1);

namespace Src\Config\Infrastructure\Persistence\Eloquent;

use Src\Config\Domain\Entities\Source as DomainSource;
use Src\Config\Domain\Repositories\SourceRepository;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Eloquent implementation of the Domain SourceRepository contract.
 *
 * Maps between the pure Domain aggregate and one row per source.
 * Stored rows always satisfy the entity invariants (written only
 * through validated handlers), so hydration assumes well-formed
 * values and fails loudly on corruption.
 */
final class EloquentSourceRepository implements SourceRepository
{
    public function findById(Ulid $id): ?DomainSource
    {
        $model = Source::query()->where('id', (string) $id)->first();

        return $model === null ? null : SourceMapper::toDomain($model);
    }

    public function findByIdForUser(Ulid $id, Ulid $userId): ?DomainSource
    {
        $model = Source::query()
            ->where('id', (string) $id)
            ->where('user_id', (string) $userId)
            ->first();

        return $model === null ? null : SourceMapper::toDomain($model);
    }

    public function listForUser(Ulid $userId): array
    {
        // T1 < T2 < T3 sorts alphabetically, so a plain orderBy gives
        // run order with no database-specific CASE expression.
        return Source::query()
            ->where('user_id', (string) $userId)
            ->orderBy('priority')
            ->orderBy('name')
            ->get()
            ->map(fn (Source $model): DomainSource => SourceMapper::toDomain($model))
            ->all();
    }

    public function existsForUserWithName(Ulid $userId, string $name, ?Ulid $ignoreId = null): bool
    {
        // LOWER() works on both Postgres and SQLite, so the check stays
        // portable while catching Arbeitnow vs arbeitnow duplicates.
        $query = Source::query()
            ->where('user_id', (string) $userId)
            ->whereRaw('LOWER(name) = ?', [mb_strtolower(trim($name))]);

        if ($ignoreId !== null) {
            $query->where('id', '!=', (string) $ignoreId);
        }

        return $query->exists();
    }

    public function existsForUserWithUrl(Ulid $userId, string $url, ?Ulid $ignoreId = null): bool
    {
        $query = Source::query()
            ->where('user_id', (string) $userId)
            ->where('url', trim($url));

        if ($ignoreId !== null) {
            $query->where('id', '!=', (string) $ignoreId);
        }

        return $query->exists();
    }

    public function save(DomainSource $source): void
    {
        Source::query()->updateOrCreate(
            ['id' => (string) $source->id],
            SourceMapper::toRow($source),
        );
    }

    public function delete(DomainSource $source): void
    {
        Source::query()->where('id', (string) $source->id)->delete();
    }
}
