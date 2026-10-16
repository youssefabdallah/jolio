<?php

declare(strict_types=1);

namespace Src\Config\Application\Queries;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Src\Config\Domain\Entities\Source;
use Src\Config\Infrastructure\Persistence\Eloquent\Source as SourceModel;
use Src\Config\Infrastructure\Persistence\Eloquent\SourceMapper;

/**
 * Read-side projection over the sources table.
 *
 * Per the architecture rules the read side may query Eloquent
 * directly instead of hydrating write aggregates row by row: filters
 * and pagination happen in the database, and each row is mapped to
 * the Domain entity for a uniform Resource shape. Run order
 * (T1 < T2 < T3) sorts alphabetically, so no CASE expression is needed.
 */
final readonly class ListSourcesHandler
{
    /**
     * @return LengthAwarePaginator<int, Source>
     */
    public function handle(ListSourcesQuery $query): LengthAwarePaginator
    {
        $search = $query->search === null || trim($query->search) === ''
            ? null
            : mb_strtolower(trim($query->search));

        $paginator = SourceModel::query()
            ->where('user_id', (string) $query->userId)
            ->when($query->type !== null, fn ($q) => $q->where('type', $query->type))
            ->when($query->isEnabled !== null, fn ($q) => $q->where('is_enabled', $query->isEnabled))
            ->when($search !== null, fn ($q) => $q->where(function ($nested) use ($search): void {
                // LOWER() LIKE stays portable across Postgres and SQLite.
                $nested->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"])
                    ->orWhereRaw('LOWER(url) LIKE ?', ["%{$search}%"]);
            }))
            ->orderBy('priority')
            ->orderBy('name')
            ->orderBy('id')
            ->paginate(max(1, min(100, $query->perPage)));

        return $paginator->through(fn (SourceModel $model): Source => SourceMapper::toDomain($model));
    }
}
