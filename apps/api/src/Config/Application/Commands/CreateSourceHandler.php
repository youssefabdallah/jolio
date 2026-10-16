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
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Persists one validated registry entry.
 *
 * Primitives become value objects here, so malformed input fails as
 * InvalidSource (rendered 422 centrally) before any write. Per-user
 * name/URL collisions fail as a 409 conflict instead of leaking a
 * database error; the unique indexes remain as the final guard. The
 * single save needs no transaction (single-statement writes are
 * already atomic), which keeps the handler unit-testable like the
 * Identity handlers.
 */
final readonly class CreateSourceHandler
{
    public function __construct(private SourceRepository $sources) {}

    /**
     * @throws InvalidSource
     */
    public function handle(CreateSourceCommand $command): Source
    {
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

        if ($this->sources->existsForUserWithName($command->userId, (string) $name)) {
            throw InvalidSource::nameTaken((string) $name);
        }

        if ($this->sources->existsForUserWithUrl($command->userId, (string) $url)) {
            throw InvalidSource::urlTaken((string) $url);
        }

        $source = Source::fromParts(
            Ulid::generate(),
            $command->userId,
            $name,
            $url,
            $type,
            $priority,
            $country,
            $command->isEnabled,
        );

        $this->sources->save($source);

        return $source;
    }
}
