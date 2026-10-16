<?php

declare(strict_types=1);

namespace Tests\Feature\Config;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Src\Identity\Infrastructure\Persistence\Eloquent\User;
use Tests\TestCase;

/**
 * Sources CRUD over HTTP (SPECS FR-39, US-302).
 *
 * Matrix per endpoint: happy path, guest 401, foreign-owner 403/404,
 * missing-row 404, shape violations 422, name/URL collisions 409.
 */
final class SourceApiTest extends TestCase
{
    use RefreshDatabase;

    private const BODY = [
        'name' => 'Arbeitnow',
        'url' => 'https://www.arbeitnow.com/api/job-board-api',
        'type' => 'search_engine',
        'priority' => 'T2',
        'country_code' => 'DE',
        'is_enabled' => true,
    ];

    public function test_rejects_guests_on_every_route(): void
    {
        $this->postJson('/api/v1/sources', self::BODY)->assertUnauthorized();
        $this->getJson('/api/v1/sources')->assertUnauthorized();
        $this->getJson('/api/v1/sources/01JABCD1234EFGH5678JKLMNP')->assertUnauthorized();
        $this->putJson('/api/v1/sources/01JABCD1234EFGH5678JKLMNP', self::BODY)->assertUnauthorized();
        $this->deleteJson('/api/v1/sources/01JABCD1234EFGH5678JKLMNP')->assertUnauthorized();
    }

    public function test_creates_lists_shows_updates_and_deletes(): void
    {
        [, $token] = $this->signedIn();

        $created = $this->withToken($token)->postJson('/api/v1/sources', self::BODY)
            ->assertCreated()
            ->assertJsonPath('data.source.name', 'Arbeitnow')
            ->assertJsonPath('data.source.country_code', 'DE')
            ->json('data.source');

        $this->withToken($token)->getJson('/api/v1/sources')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $created['id']);

        $this->withToken($token)->getJson("/api/v1/sources/{$created['id']}")
            ->assertOk()
            ->assertJsonPath('data.source.url', self::BODY['url']);

        $this->withToken($token)->putJson("/api/v1/sources/{$created['id']}", [
            ...self::BODY, 'priority' => 'T1', 'is_enabled' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.source.priority', 'T1')
            ->assertJsonPath('data.source.is_enabled', false);

        $this->withToken($token)->deleteJson("/api/v1/sources/{$created['id']}")
            ->assertNoContent();

        $this->withToken($token)->getJson("/api/v1/sources/{$created['id']}")
            ->assertNotFound()
            ->assertJsonPath('error.code', 'SOURCE_NOT_FOUND');
    }

    public function test_rejects_shape_violations_with_field_details(): void
    {
        [, $token] = $this->signedIn();

        $response = $this->withToken($token)->postJson('/api/v1/sources', [
            ...self::BODY, 'url' => 'http://example.com/feed', 'priority' => 'T9',
        ]);

        $response->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_FAILED');
        $this->assertArrayHasKey('url', (array) $response->json('error.details'));
        $this->assertArrayHasKey('priority', (array) $response->json('error.details'));
    }

    public function test_rejects_duplicate_name_or_url_as_conflict(): void
    {
        [, $token] = $this->signedIn();

        $this->withToken($token)->postJson('/api/v1/sources', self::BODY)->assertCreated();

        $this->withToken($token)->postJson('/api/v1/sources', [...self::BODY, 'url' => 'https://example.com/other'])
            ->assertConflict()
            ->assertJsonPath('error.code', 'SOURCE_TAKEN');

        $this->withToken($token)->postJson('/api/v1/sources', [...self::BODY, 'name' => 'Other'])
            ->assertConflict()
            ->assertJsonPath('error.code', 'SOURCE_TAKEN');
    }

    public function test_hides_foreign_rows_behind_403_or_404(): void
    {
        [, $ownerToken] = $this->signedIn();
        [, $otherToken] = $this->signedIn();

        $id = $this->withToken($ownerToken)->postJson('/api/v1/sources', self::BODY)
            ->assertCreated()
            ->json('data.source.id');

        // Foreign detail/update/delete never reveal the row exists.
        $this->withToken($otherToken)->getJson("/api/v1/sources/{$id}")->assertForbidden();
        $this->withToken($otherToken)->putJson("/api/v1/sources/{$id}", self::BODY)->assertForbidden();
        $this->withToken($otherToken)->deleteJson("/api/v1/sources/{$id}")->assertForbidden();

        // ...and the owner's list stays private to the owner.
        $this->withToken($otherToken)->getJson('/api/v1/sources')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_answers_404_for_malformed_ids(): void
    {
        [, $token] = $this->signedIn();

        $this->withToken($token)->getJson('/api/v1/sources/not-a-ulid')
            ->assertNotFound()
            ->assertJsonPath('error.code', 'SOURCE_NOT_FOUND');
    }

    public function test_filters_the_list(): void
    {
        [, $token] = $this->signedIn();
        $headers = ['Authorization' => "Bearer {$token}"];

        $this->withToken($token)->postJson('/api/v1/sources', self::BODY)->assertCreated();
        $this->withToken($token)->postJson('/api/v1/sources', [
            ...self::BODY, 'name' => 'Remotive', 'url' => 'https://remotive.com/api/remote-jobs',
            'type' => 'board', 'is_enabled' => false,
        ])->assertCreated();

        $this->getJson('/api/v1/sources?type=board', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Remotive');

        $this->getJson('/api/v1/sources?is_enabled=0', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/v1/sources?search=arbeit', $headers)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Arbeitnow');
    }

    /**
     * @return array{0: User, 1: string}
     */
    private function signedIn(): array
    {
        $user = User::factory()->create();

        return [$user, $user->createToken('tests')->plainTextToken];
    }
}
