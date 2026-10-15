<?php

declare(strict_types=1);

namespace Src\Profile\Infrastructure\Persistence\Eloquent;

use Database\Factories\ProfileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent representation of the candidate Profile aggregate.
 *
 * Persistence-only: all rules live in Src\Profile\Domain. Sections are
 * JSON columns holding plain arrays; ULID string primary key.
 */
class Profile extends Model
{
    /** @use HasFactory<Profile> */
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'profiles';

    /**
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
        'user_id',
        'contact',
        'headline',
        'summary',
        'skills',
        'experience',
        'education',
        'languages',
        'current_step',
        'completion_percent',
    ];

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): ProfileFactory
    {
        return ProfileFactory::new();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'contact' => 'array',
            'skills' => 'array',
            'experience' => 'array',
            'education' => 'array',
            'languages' => 'array',
        ];
    }
}
