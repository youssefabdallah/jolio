<?php

declare(strict_types=1);

namespace Src\Config\Application\Commands;

use Src\Config\Domain\Exceptions\InvalidSource;
use Src\Config\Domain\Repositories\SourceRepository;

/**
 * Removes one owned registry entry.
 *
 * Missing rows fail as a 404; foreign rows never reach here —
 * SourcePolicy rejects them with 403 during authorization.
 */
final readonly class DeleteSourceHandler
{
    public function __construct(private SourceRepository $sources) {}

    /**
     * @throws InvalidSource
     */
    public function handle(DeleteSourceCommand $command): void
    {
        $existing = $this->sources->findByIdForUser($command->id, $command->userId);
        if ($existing === null) {
            throw InvalidSource::notFound((string) $command->id);
        }

        $this->sources->delete($existing);
    }
}
