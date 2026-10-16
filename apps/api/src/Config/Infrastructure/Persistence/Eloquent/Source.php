<?php

declare(strict_types=1);

namespace Src\Config\Infrastructure\Persistence\Eloquent;

use Database\Factories\SourceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent representation of one job-source registry entry.
 *
 * Persistence-only: all rules live in Src\Config\Domain. Type,
 * priority, and country are validated strings (enums enforced in the
 * Domain, cast on read).
 */
class Source extends Model
{
    /** @use HasFactory<Source> */
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'sources';

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
        'name',
        'url',
        'type',
        'priority',
        'country_code',
        'is_enabled',
    ];

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): SourceFactory
    {
        return SourceFactory::new();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
        ];
    }
}
