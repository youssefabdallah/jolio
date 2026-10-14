<?php

declare(strict_types=1);

namespace Src\Identity\Presentation\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Src\Identity\Domain\Entities\User;

/**
 * Public shape of the Identity user. Sequential keys never leak: the
 * identifier is the ULID string, and no credential ever serializes.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var User $user */
        $user = $this->resource;

        return [
            'id' => (string) $user->id,
            'display_name' => $user->displayName,
            'email' => (string) $user->email,
            'provider' => $user->provider->value,
            'avatar_url' => $user->avatarUrl,
        ];
    }
}
