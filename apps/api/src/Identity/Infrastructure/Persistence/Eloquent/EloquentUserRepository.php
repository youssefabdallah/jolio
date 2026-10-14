<?php

declare(strict_types=1);

namespace Src\Identity\Infrastructure\Persistence\Eloquent;

use Src\Identity\Domain\Entities\User as DomainUser;
use Src\Identity\Domain\Enums\AuthProvider;
use Src\Identity\Domain\Repositories\UserRepository;
use Src\Identity\Domain\ValueObjects\Email;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Eloquent implementation of the Domain UserRepository contract.
 *
 * Maps between the pure Domain aggregate and the Eloquent model. Uniqueness
 * violations (email, provider pair) surface as QueryException from the
 * database constraints; application-level checks belong in the future
 * registration handler, not here.
 */
final class EloquentUserRepository implements UserRepository
{
    public function findById(Ulid $id): ?DomainUser
    {
        $model = User::query()->where('id', (string) $id)->first();

        return $model === null ? null : $this->toDomain($model);
    }

    public function findByEmail(Email $email): ?DomainUser
    {
        $model = User::query()->where('email', (string) $email)->first();

        return $model === null ? null : $this->toDomain($model);
    }

    public function findByProvider(AuthProvider $provider, string $providerId): ?DomainUser
    {
        $model = User::query()
            ->where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        return $model === null ? null : $this->toDomain($model);
    }

    public function existsByEmail(Email $email): bool
    {
        return User::query()->where('email', (string) $email)->exists();
    }

    public function save(DomainUser $user): void
    {
        User::query()->updateOrCreate(
            ['id' => (string) $user->id],
            [
                'display_name' => $user->displayName,
                'email' => (string) $user->email,
                'password' => $user->passwordHash,
                'provider' => $user->provider,
                'provider_id' => $user->providerId,
                'avatar_url' => $user->avatarUrl,
            ],
        );
    }

    /**
     * Rebuild the Domain aggregate from a persisted row. Stored rows always
     * satisfy the entity invariants (enforced at creation + DB constraints).
     */
    private function toDomain(User $model): DomainUser
    {
        $id = Ulid::fromString($model->id);
        $email = Email::fromString($model->email);

        if ($model->provider instanceof AuthProvider && $model->provider->isOAuth()) {
            return DomainUser::registerOAuth(
                $id,
                $email,
                $model->display_name,
                $model->provider,
                (string) $model->provider_id,
                $model->avatar_url,
            );
        }

        return DomainUser::registerLocal(
            $id,
            $email,
            $model->display_name,
            (string) $model->password,
            $model->avatar_url,
        );
    }
}
