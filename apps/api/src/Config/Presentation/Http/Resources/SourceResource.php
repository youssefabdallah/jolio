<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Config\Domain\Entities\Source;

/**
 * Public shape of one job-source registry entry.
 *
 * Mirrors the Stitch table row plus the edit drawer fields. Enums
 * serialize as their backed values; telemetry (success rate, last
 * run, status) is intentionally absent — it is derived from future
 * search runs, never stored on the row (FR-40).
 *
 * @mixin Source
 */
class SourceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var Source $source */
        $source = $this->resource;

        return [
            'id' => (string) $source->id,
            'name' => (string) $source->name,
            'url' => (string) $source->url,
            'type' => $source->type->value,
            'priority' => $source->priority->value,
            'country_code' => (string) $source->country,
            'is_enabled' => $source->isEnabled,
        ];
    }
}
