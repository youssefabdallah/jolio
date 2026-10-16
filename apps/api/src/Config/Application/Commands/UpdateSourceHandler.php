<?php

declare(strict_types=1);

namespace Src\Config\Application\Commands;

use Src\Config\Domain\Entities\Source;
use Src\Config\Domain\Enums\SourcePriority;
use Src\Config\Domain\Enums\SourceType;
use Src\Config\Domain\Exceptions\InvalidSource;
use Src\Config\Domain\Repositories\SourceRepository;
use Src\Config\Domain\ValueObjects\CountryCode;
use Src\Config\Domain\ValueObjects\SourceName;
use Src\Config\Domain\ValueObjects\SourceUrl;

/**
 * Replaces one owned registry entry.
 *
 * Missing rows fail as a 404 before any validation runs. Foreign rows
 * never reach here — SourcePolicy rejects them with 403 during
 * authorization. Collision checks ignore the row being edited.
 */
final readonly class UpdateSourceHandler
{
    public function __construct(private SourceRepository $sources) {}

    /**
     * @throws InvalidSource
     */
    public function handle(UpdateSourceCommand $command): Source
    {
        $existing = $this->sources->findByIdForUser($command->id, $command->userId);
        if ($existing === null) {
            throw InvalidSource::notFound((string) $command->id);
        }

        $name = SourceName::fromString($command->name);
        $url = SourceUrl::fromString($command->url);

        $type = SourceType::tryFrom(strtolower(trim($command->type)));
        if ($type === null) {
            throw InvalidSource::unknownLevel('type', $command->type);
        }

        $priority = SourcePriority::tryFrom(strtoupper(trim($command->priority)));
        if ($priority === null) {
            throw InvalidSource::unknownLevel('priority', $command->priority);
        }

        $country = CountryCode::fromString($command->countryCode);

        if ($this->sources->existsForUserWithName($command->userId, (string) $name, $existing->id)) {
            throw InvalidSource::nameTaken((string) $name);
        }

        if ($this->sources->existsForUserWithUrl($command->userId, (string) $url, $existing->id)) {
            throw InvalidSource::urlTaken((string) $url);
        }

        $replaced = $existing->replace($name, $url, $type, $priority, $country, $command->isEnabled);

        $this->sources->save($replaced);

        return $replaced;
    }
}
