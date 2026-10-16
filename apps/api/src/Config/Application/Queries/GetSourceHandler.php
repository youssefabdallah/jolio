<?php

declare(strict_types=1);

namespace Src\Config\Application\Queries;

use Src\Config\Domain\Entities\Source;
use Src\Config\Domain\Exceptions\InvalidSource;
use Src\Config\Domain\Repositories\SourceRepository;

/**
 * Owner-scoped single read. No transaction: one row, no writes.
 */
final readonly class GetSourceHandler
{
    public function __construct(private SourceRepository $sources) {}

    /**
     * @throws InvalidSource
     */
    public function handle(GetSourceQuery $query): Source
    {
        $source = $this->sources->findByIdForUser($query->id, $query->userId);
        if ($source === null) {
            throw InvalidSource::notFound((string) $query->id);
        }

        return $source;
    }
}
