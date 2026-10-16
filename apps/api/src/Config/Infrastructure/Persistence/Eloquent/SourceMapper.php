<?php

declare(strict_types=1);

namespace Src\Config\Infrastructure\Persistence\Eloquent;

use Src\Config\Domain\Entities\Source as DomainSource;
use Src\Config\Domain\Enums\SourcePriority;
use Src\Config\Domain\Enums\SourceType;
use Src\Config\Domain\ValueObjects\CountryCode;
use Src\Config\Domain\ValueObjects\SourceName;
use Src\Config\Domain\ValueObjects\SourceUrl;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Maps between the Eloquent Source row and the Domain aggregate.
 *
 * Stored rows always satisfy the entity invariants (written only
 * through validated handlers), so hydration assumes well-formed
 * values and fails loudly on corruption instead of guessing.
 */
final class SourceMapper
{
    private function __construct() {}

    public static function toDomain(Source $model): DomainSource
    {
        return DomainSource::fromParts(
            Ulid::fromString($model->id),
            Ulid::fromString($model->user_id),
            SourceName::fromString($model->name),
            SourceUrl::fromString($model->url),
            SourceType::from($model->type),
            SourcePriority::from($model->priority),
            CountryCode::fromString($model->country_code),
            (bool) $model->is_enabled,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public static function toRow(DomainSource $source): array
    {
        return [
            'user_id' => (string) $source->userId,
            'name' => (string) $source->name,
            'url' => (string) $source->url,
            'type' => $source->type->value,
            'priority' => $source->priority->value,
            'country_code' => (string) $source->country,
            'is_enabled' => $source->isEnabled,
        ];
    }
}
