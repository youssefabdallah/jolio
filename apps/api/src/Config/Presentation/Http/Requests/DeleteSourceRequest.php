<?php

declare(strict_types=1);

namespace Src\Config\Presentation\Http\Requests;

/**
 * Guards "Delete source" (Stitch drawer destructive action).
 *
 * Carries no body rules: ownership is the whole check, via
 * SourcePolicy. A missing id falls through so the handler 404s.
 */
final class DeleteSourceRequest extends BaseSourceRequest
{
    public function authorize(): bool
    {
        $existing = $this->ownedSource();

        return $existing === null || $this->user()->can('delete', $existing);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
