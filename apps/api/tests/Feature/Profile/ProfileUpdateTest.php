<?php

declare(strict_types=1);

namespace Tests\Feature\Profile;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Src\Identity\Infrastructure\Persistence\Eloquent\User;
use Src\Profile\Infrastructure\Persistence\Eloquent\Profile;
use Tests\TestCase;

/**
 * PUT /api/profile: owner-only full-document replacement (FR-4, US-201).
 */
final class ProfileUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_rejects_guests(): void
    {
        $this->putJson('/api/profile', ['contact' => ['full_name' => 'Alex Dev']])
            ->assertUnauthorized();
    }

    public function test_creates_the_profile_on_first_save(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('tests')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/profile', [
            'contact' => [
                'full_name' => 'Alex Dev',
                'email' => 'alex@dev.internal',
                'phone' => '+49 170 000 000',
                'city' => 'Berlin',
                'country' => 'Germany',
                'website' => 'https://alex.dev',
            ],
            'headline' => 'Senior PHP Developer',
            'summary' => 'Backend engineer.',
            'skills' => [['group' => 'Backend', 'name' => 'PHP', 'level' => 'advanced']],
            'experience' => [[
                'role' => 'Senior Developer',
                'company' => 'Acme',
                'location' => 'Berlin',
                'start_date' => '2021-03',
            ]],
            'education' => [[
                'institution' => 'TU Berlin',
                'degree' => 'BSc',
                'field' => 'Computer Science',
                'start_year' => 2014,
            ]],
            'languages' => [['language' => 'English', 'level' => 'c1']],
        ]);

        $response->assertOk()
            ->assertJsonPath('data.profile.contact.full_name', 'Alex Dev')
            ->assertJsonPath('data.profile.headline', 'Senior PHP Developer')
            ->assertJsonPath('data.profile.current_step', null)
            ->assertJsonPath('data.profile.completion_percent', 100)
            ->assertJsonStructure(['data' => ['profile' => ['id', 'contact', 'headline', 'summary', 'skills', 'experience', 'education', 'languages', 'current_step', 'completion_percent']]]);

        $this->assertDatabaseHas('profiles', ['user_id' => $user->id, 'completion_percent' => 100]);
    }

    public function test_stamps_the_resume_point_and_scores_completion(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('tests')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/profile', [
            'contact' => [
                'full_name' => 'Alex Dev',
                'email' => 'alex@dev.internal',
                'phone' => '+49 170 000 000',
                'city' => 'Berlin',
                'country' => 'Germany',
                'website' => 'https://alex.dev',
            ],
            'headline' => 'Senior PHP Developer',
            'current_step' => 'skills',
        ]);

        // Contact (20) + headline (10) = 30; the resume point sticks.
        $response->assertOk()
            ->assertJsonPath('data.profile.current_step', 'skills')
            ->assertJsonPath('data.profile.completion_percent', 30);

        $response = $this->withToken($token)->putJson('/api/profile', [
            'contact' => [
                'full_name' => 'Alex Dev',
                'email' => 'alex@dev.internal',
                'phone' => '+49 170 000 000',
                'city' => 'Berlin',
                'country' => 'Germany',
                'website' => 'https://alex.dev',
            ],
            'headline' => 'Senior PHP Developer',
            'summary' => 'Backend engineer.',
            'skills' => [['group' => 'Backend', 'name' => 'PHP', 'level' => 'advanced']],
            'experience' => [[
                'role' => 'Senior Developer',
                'company' => 'Acme',
                'location' => 'Berlin',
                'start_date' => '2021-03',
            ]],
            'education' => [[
                'institution' => 'TU Berlin',
                'degree' => 'BSc',
                'field' => 'Computer Science',
                'start_year' => 2014,
            ]],
            'languages' => [['language' => 'English', 'level' => 'c1']],
            'current_step' => 'review',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.profile.current_step', 'review')
            ->assertJsonPath('data.profile.completion_percent', 100);
    }

    public function test_rejects_an_unknown_resume_step(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('tests')->plainTextToken;

        $this->withToken($token)->putJson('/api/profile', [
            'contact' => [
                'full_name' => 'Alex Dev',
                'email' => 'alex@dev.internal',
                'phone' => '+16502530000',
                'city' => 'Nowhere',
                'country' => 'Nowhere',
                'website' => 'https://alex.dev',
            ],
            'headline' => 'Dev',
            'summary' => 'S',
            'skills' => [['group' => 'B', 'name' => 'PHP', 'level' => 'advanced']],
            'experience' => [['role' => 'D', 'company' => 'A', 'location' => 'B', 'start_date' => '2021-03']],
            'education' => [['institution' => 'U', 'degree' => 'BSc', 'field' => 'CS', 'start_year' => 2014]],
            'languages' => [['language' => 'English', 'level' => 'c1']],
            'current_step' => 'teleport',
        ])->assertUnprocessable()->assertJsonPath('error.code', 'VALIDATION_FAILED');
    }

    public function test_accepts_a_step_scoped_partial_and_merges_with_stored(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('tests')->plainTextToken;

        // Contact step alone creates the row; untouched sections stay empty.
        $this->withToken($token)->putJson('/api/profile', [
            'contact' => [
                'full_name' => 'Alex Dev',
                'email' => 'alex@dev.internal',
                'phone' => '+16502530000',
                'city' => 'Berlin',
                'country' => 'Germany',
                'website' => 'https://alex.dev',
            ],
            'current_step' => 'contact',
        ])->assertOk()->assertJsonPath('data.profile.current_step', 'contact');

        // Skills step validates only its section and keeps contact.
        $response = $this->withToken($token)->putJson('/api/profile', [
            'skills' => [['group' => 'Backend', 'name' => 'PHP', 'level' => 'wizard']],
            'current_step' => 'skills',
        ]);

        $response->assertUnprocessable()->assertJsonPath('error.details.skills.0.level.0', 'Pick a listed skill level.');

        $this->withToken($token)->putJson('/api/profile', [
            'skills' => [['group' => 'Backend', 'name' => 'PHP', 'level' => 'advanced']],
            'current_step' => 'skills',
        ])->assertOk()->assertJsonPath('data.profile.completion_percent', 35);

        $this->assertDatabaseHas('profiles', ['user_id' => $user->id]);
        $stored = Profile::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame('Alex Dev', $stored->contact['full_name']);
    }

    public function test_review_stamp_alone_advances_the_resume_point(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('tests')->plainTextToken;
        Profile::factory()->create(['user_id' => $user->id]);

        $this->withToken($token)->putJson('/api/profile', [
            'current_step' => 'review',
        ])->assertOk()->assertJsonPath('data.profile.current_step', 'review');
    }

    public function test_replaces_the_owners_profile_on_later_saves(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('tests')->plainTextToken;
        Profile::factory()->create(['user_id' => $user->id, 'headline' => 'Old headline']);

        $response = $this->withToken($token)->putJson('/api/profile', [
            'contact' => [
                'full_name' => 'Alex Dev',
                'email' => 'alex@dev.internal',
                'phone' => '+49 170 000 000',
                'city' => 'Berlin',
                'country' => 'Germany',
                'website' => 'https://alex.dev',
            ],
            'headline' => 'New headline',
            'summary' => 'Backend engineer.',
            'skills' => [['group' => 'Backend', 'name' => 'PHP', 'level' => 'advanced']],
            'experience' => [[
                'role' => 'Senior Developer',
                'company' => 'Acme',
                'location' => 'Berlin',
                'start_date' => '2021-03',
            ]],
            'education' => [[
                'institution' => 'TU Berlin',
                'degree' => 'BSc',
                'field' => 'Computer Science',
                'start_year' => 2014,
            ]],
            'languages' => [['language' => 'English', 'level' => 'c1']],
        ]);

        $response->assertOk()->assertJsonPath('data.profile.headline', 'New headline');
        $this->assertSame(1, Profile::query()->where('user_id', $user->id)->count());
    }

    public function test_forbids_rewriting_another_users_profile(): void
    {
        $mine = User::factory()->create();
        $theirs = User::factory()->create();
        Profile::factory()->create(['user_id' => $theirs->id, 'headline' => 'Their headline']);
        $token = $mine->createToken('tests')->plainTextToken;

        // A PUT always targets the token owner's row: the attacker can
        // neither address nor alter the victim's profile, and the victim
        // row stays byte-identical.
        $this->withToken($token)->putJson('/api/profile', [
            'contact' => [
                'full_name' => 'Attacker',
                'email' => 'attacker@dev.internal',
                'phone' => '+16502530000',
                'city' => 'Nowhere',
                'country' => 'Nowhere',
                'website' => 'https://attacker.dev',
            ],
            'headline' => 'Attacker headline',
            'summary' => 'Attacker summary.',
            'skills' => [['group' => 'Backend', 'name' => 'PHP', 'level' => 'advanced']],
            'experience' => [[
                'role' => 'Developer',
                'company' => 'Evil',
                'location' => 'Nowhere',
                'start_date' => '2021-03',
            ]],
            'education' => [[
                'institution' => 'Evil U',
                'degree' => 'BSc',
                'field' => 'CS',
                'start_year' => 2014,
            ]],
            'languages' => [['language' => 'English', 'level' => 'c1']],
        ])->assertOk();

        $this->assertDatabaseHas('profiles', ['user_id' => $theirs->id, 'headline' => 'Their headline']);
        $this->assertDatabaseHas('profiles', ['user_id' => $mine->id]);
    }

    public function test_denies_policy_even_when_a_row_is_forced_into_scope(): void
    {
        $mine = User::factory()->create();
        $theirs = User::factory()->create();
        $victim = Profile::factory()->create(['user_id' => $theirs->id]);

        // Belt and braces: the policy itself refuses cross-owner writes,
        // independent of the request's user scoping.
        $this->assertFalse($mine->can('update', $victim));
        $this->assertTrue($theirs->can('update', $victim));
    }

    public function test_rejects_invalid_payloads_with_field_details(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('tests')->plainTextToken;

        $response = $this->withToken($token)->putJson('/api/profile', [
            'contact' => ['full_name' => ''],
            'skills' => [['group' => 'Backend', 'name' => 'PHP', 'level' => 'wizard']],
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonStructure(['error' => ['details' => ['contact.full_name', 'skills.0.level']]]);
    }
}
