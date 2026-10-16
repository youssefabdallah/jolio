<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use InvalidArgumentException;
use Src\Config\Domain\Exceptions\InvalidSource;
use Src\Config\Infrastructure\Persistence\Eloquent\Source;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Shared behavior for the Sources endpoints.
 *
 * Centralizes the uniform 422 envelope plus route-id handling: a
 * malformed ULID can never reach a handler (it becomes a 404 for the
 * same id), and ownership lookups never throw for unknown rows.
 */
abstract class BaseSourceRequest extends FormRequest
{
    /**
     * The row for the {source} route parameter, or null when the id is
     * malformed or missing. Ownership is NOT filtered here: callers
     * pass the row through SourcePolicy so foreign ids answer 403
     * (consistent with the Profile endpoints), while truly missing
     * ids fall through to the handler for a 404.
     */
    protected function ownedSource(): ?Source
    {
        $raw = $this->route('source');
        if (! is_string($raw)) {
            return null;
        }

        try {
            $id = Ulid::fromString($raw);
        } catch (InvalidArgumentException) {
            return null;
        }

        return Source::query()->where('id', (string) $id)->first();
    }

    /**
     * Route id as a ULID. Malformed ids answer 404 (not 500): there is
     * no row with that id for anyone.
     *
     * @throws InvalidSource
     */
    public function sourceId(): Ulid
    {
        $raw = (string) $this->route('source');

        try {
            return Ulid::fromString($raw);
        } catch (InvalidArgumentException) {
            throw InvalidSource::notFound($raw);
        }
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(response()->json([
            'error' => [
                'code' => 'VALIDATION_FAILED',
                'message' => __('config.errors.validation_failed'),
                'details' => $validator->errors()->toArray(),
            ],
        ], 422));
    }
}
