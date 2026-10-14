<?php

declare(strict_types=1);

namespace Src\Identity\Infrastructure\Persistence\Eloquent;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Src\Identity\Domain\Enums\AuthProvider;

/**
 * Eloquent representation of the Identity User aggregate.
 *
 * Persistence-only: all business rules live in
 * Src\Identity\Domain\Entities\User. ULID string primary key, so
 * auto-incrementing is disabled.
 */
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The primary key is a ULID string, never auto-incremented.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * @var bool
     */
    public $incrementing = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'id',
        'display_name',
        'email',
        'email_verified_at',
        'password',
        'provider',
        'provider_id',
        'avatar_url',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'provider' => AuthProvider::class,
        ];
    }
}
