<?php

declare(strict_types=1);

namespace Tests\Feature\Identity;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Mockery;
use Src\Identity\Infrastructure\Persistence\Eloquent\User;
use Tests\TestCase;

/**
 * Registration endpoints: credentials register, OAuth redirect/callback.
 */
final class AuthRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registers_with_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'display_name' => 'Alex Dev',
            'email' => 'alex@dev.internal',
            'password' => 's3cret-pass',
            'password_confirmation' => 's3cret-pass',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.email', 'alex@dev.internal')
            ->assertJsonPath('data.user.provider', 'local')
            ->assertJsonStructure(['data' => ['user' => ['id', 'display_name', 'email', 'provider'], 'token']]);

        $this->assertDatabaseHas('users', ['email' => 'alex@dev.internal', 'provider' => 'local']);

        $model = User::query()->where('email', 'alex@dev.internal')->firstOrFail();
        $this->assertTrue(Hash::check('s3cret-pass', $model->password));
        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_rejects_invalid_registration_payloads(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'display_name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'mismatch',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonStructure(['error' => ['details' => ['display_name', 'email', 'password']]]);
    }

    public function test_rejects_a_taken_email_at_the_request_boundary(): void
    {
        User::factory()->create(['email' => 'taken@dev.internal']);

        // The FormRequest unique rule answers first (422); the handler's
        // 409 covers the race window and is unit-tested.
        $response = $this->postJson('/api/v1/auth/register', [
            'display_name' => 'Someone Else',
            'email' => 'taken@dev.internal',
            'password' => 's3cret-pass',
            'password_confirmation' => 's3cret-pass',
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_FAILED')
            ->assertJsonPath(
                'error.details.email.0',
                __('identity.validation.email_taken')
            );
    }

    public function test_redirects_to_google_when_configured(): void
    {
        config()->set('services.google', [
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
        ]);

        $response = $this->getJson('/api/v1/auth/google/redirect');

        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', (string) $response->headers->get('Location'));
    }

    public function test_refuses_redirect_when_oauth_is_not_configured(): void
    {
        config()->set('services.google', ['client_id' => null, 'client_secret' => null]);

        $response = $this->getJson('/api/v1/auth/google/redirect');

        $response->assertStatus(503)->assertJsonPath('error.code', 'OAUTH_NOT_CONFIGURED');
    }

    public function test_rejects_unsupported_providers(): void
    {
        $this->getJson('/api/v1/auth/github/redirect')->assertUnprocessable();
        $this->getJson('/api/v1/auth/github/callback')->assertUnprocessable();
    }

    public function test_completes_the_oauth_callback_for_a_new_user(): void
    {
        config()->set('services.google', [
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
        ]);
        $this->mockSocialiteUser('google-123', 'alex@gmail.com', 'Alex Dev');

        $response = $this->getJson('/api/v1/auth/google/callback?code=auth-code&state=xyz');

        $response->assertRedirect();
        $location = (string) $response->headers->get('Location');
        $this->assertStringStartsWith('http://localhost:3000/auth/callback#', $location);
        $this->assertStringContainsString('token=', $location);

        $this->assertDatabaseHas('users', [
            'email' => 'alex@gmail.com',
            'provider' => 'google',
            'provider_id' => 'google-123',
        ]);
        $model = User::query()->where('email', 'alex@gmail.com')->firstOrFail();
        $this->assertNull($model->password);
    }

    public function test_signs_in_an_existing_oauth_user_without_duplicating(): void
    {
        config()->set('services.google', [
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
        ]);
        User::factory()->oauth()->create(['email' => 'alex@gmail.com', 'provider_id' => 'google-123']);
        $this->mockSocialiteUser('google-123', 'alex@gmail.com', 'Alex Dev');

        $this->getJson('/api/v1/auth/google/callback?code=auth-code')->assertRedirect();

        $this->assertSame(1, User::query()->where('email', 'alex@gmail.com')->count());
    }

    public function test_stores_the_provider_avatar_on_first_oauth_sign_in(): void
    {
        config()->set('services.google', [
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
        ]);
        $this->mockSocialiteUser('google-123', 'alex@gmail.com', 'Alex Dev', 'https://avatars.example/a.png');

        $this->getJson('/api/v1/auth/google/callback?code=auth-code')->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'alex@gmail.com',
            'avatar_url' => 'https://avatars.example/a.png',
        ]);
    }

    public function test_refreshes_the_avatar_on_returning_oauth_sign_in(): void
    {
        config()->set('services.google', [
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
        ]);
        User::factory()->oauth()->create([
            'email' => 'alex@gmail.com',
            'provider_id' => 'google-123',
            'avatar_url' => 'https://avatars.example/old.png',
        ]);
        $this->mockSocialiteUser('google-123', 'alex@gmail.com', 'Alex Dev II', 'https://avatars.example/new.png');

        $this->getJson('/api/v1/auth/google/callback?code=auth-code')->assertRedirect();

        $this->assertSame(1, User::query()->where('email', 'alex@gmail.com')->count());
        $this->assertDatabaseHas('users', [
            'email' => 'alex@gmail.com',
            'display_name' => 'Alex Dev II',
            'avatar_url' => 'https://avatars.example/new.png',
        ]);
    }

    public function test_keeps_the_stored_avatar_when_the_provider_sends_none(): void
    {
        config()->set('services.google', [
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
        ]);
        User::factory()->oauth()->create([
            'email' => 'alex@gmail.com',
            'provider_id' => 'google-123',
            'avatar_url' => 'https://avatars.example/kept.png',
        ]);
        $this->mockSocialiteUser('google-123', 'alex@gmail.com', 'Alex Dev');

        $this->getJson('/api/v1/auth/google/callback?code=auth-code')->assertRedirect();

        $this->assertDatabaseHas('users', [
            'email' => 'alex@gmail.com',
            'avatar_url' => 'https://avatars.example/kept.png',
        ]);
    }

    public function test_returns_the_user_schema_with_avatar_on_session_lookup(): void
    {
        $model = User::factory()->oauth()->create([
            'email' => 'alex@gmail.com',
            'avatar_url' => 'https://avatars.example/a.png',
        ]);
        $token = $model->createToken('tests')->plainTextToken;

        $response = $this->withToken($token)->getJson('/api/user');

        $response->assertOk()
            ->assertJsonPath('email', 'alex@gmail.com')
            ->assertJsonPath('avatar_url', 'https://avatars.example/a.png')
            ->assertJsonStructure(['id', 'display_name', 'email', 'provider', 'avatar_url'])
            ->assertJsonMissingPath('provider_id');
    }

    public function test_redirects_with_an_error_when_the_email_belongs_to_another_account(): void
    {
        config()->set('services.google', [
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
        ]);
        User::factory()->create(['email' => 'alex@gmail.com']);
        $this->mockSocialiteUser('google-999', 'alex@gmail.com', 'Alex Dev');

        $response = $this->getJson('/api/v1/auth/google/callback?code=auth-code');

        $response->assertRedirect();
        $location = (string) $response->headers->get('Location');
        $this->assertStringStartsWith('http://localhost:3000/auth/callback#', $location);
        $this->assertStringContainsString('error=EMAIL_TAKEN', $location);

        $this->assertSame(1, User::query()->where('email', 'alex@gmail.com')->count());
    }

    public function test_redirects_with_an_error_when_the_handshake_is_denied(): void
    {
        config()->set('services.google', [
            'client_id' => 'test-client-id',
            'client_secret' => 'test-client-secret',
            'redirect' => 'http://localhost:8000/api/v1/auth/google/callback',
        ]);

        $driver = Mockery::mock();
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('user')->andThrow(new \RuntimeException('access denied'));
        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);

        $response = $this->getJson('/api/v1/auth/google/callback?error=access_denied');

        // Mid-navigation failures return to the SPA, never raw JSON.
        $response->assertRedirect();
        $location = (string) $response->headers->get('Location');
        $this->assertStringStartsWith('http://localhost:3000/auth/callback#', $location);
        $this->assertStringContainsString('error=OAUTH_FAILED', $location);
    }

    public function test_logout_revokes_the_current_token(): void
    {
        $model = User::factory()->create();
        $token = $model->createToken('tests')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/v1/auth/logout');

        $response->assertNoContent();
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $model->id]);

        // Guards memoize per process: forget them so the next call performs
        // a real token lookup like a fresh HTTP request would.
        Auth::forgetGuards();

        $this->withToken($token)->getJson('/api/user')->assertUnauthorized();
    }

    public function test_logout_rejects_guests(): void
    {
        $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
    }

    public function test_signs_in_with_valid_credentials(): void
    {
        User::factory()->create([
            'email' => 'alex@dev.internal',
            'password' => Hash::make('s3cret-pass'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'alex@dev.internal',
            'password' => 's3cret-pass',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.user.email', 'alex@dev.internal')
            ->assertJsonStructure(['data' => ['user' => ['id', 'display_name', 'email', 'provider'], 'token']]);
        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_returns_identical_401s_for_unknown_email_and_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'alex@dev.internal',
            'password' => Hash::make('s3cret-pass'),
        ]);

        $unknown = $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@nowhere.dev',
            'password' => 's3cret-pass',
        ]);
        $wrong = $this->postJson('/api/v1/auth/login', [
            'email' => 'alex@dev.internal',
            'password' => 'wrong-pass',
        ]);

        $unknown->assertUnauthorized()->assertJsonPath('error.code', 'INVALID_CREDENTIALS');
        $wrong->assertUnauthorized()->assertJsonPath('error.code', 'INVALID_CREDENTIALS');
        $this->assertSame($unknown->json(), $wrong->json());
    }

    public function test_rejects_malformed_login_payloads(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'not-an-email'])
            ->assertUnprocessable()
            ->assertJsonPath('error.code', 'VALIDATION_FAILED');
    }

    public function test_answers_lockouts_in_the_error_envelope(): void
    {
        // Six rapid hits always exhaust the 5/min login bucket, regardless
        // of earlier tests sharing this process: the 6th is refused.
        $response = null;
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $response = $this->postJson('/api/v1/auth/login', [
                'email' => 'nobody@nowhere.dev',
                'password' => 'whatever',
            ]);
        }

        $response->assertStatus(429)
            ->assertJsonPath('error.code', 'TOO_MANY_ATTEMPTS')
            ->assertJsonPath('error.message', __('http.too_many_attempts'));
        $this->assertNotEmpty($response->headers->get('Retry-After'));
    }

    /**
     * Fake the provider handshake: Socialite returns a fixed Google profile.
     */
    private function mockSocialiteUser(string $id, string $email, string $name, ?string $avatar = null): void
    {
        $profile = new SocialiteUser;
        $profile->id = $id;
        $profile->email = $email;
        $profile->name = $name;
        $profile->avatar = $avatar;

        $driver = Mockery::mock();
        $driver->shouldReceive('stateless')->andReturnSelf();
        $driver->shouldReceive('user')->andReturn($profile);
        Socialite::shouldReceive('driver')->with('google')->andReturn($driver);
    }
}
