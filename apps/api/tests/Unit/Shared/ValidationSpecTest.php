<?php

declare(strict_types=1);

namespace Tests\Unit\Shared;

use PHPUnit\Framework\TestCase;
use Src\Shared\Application\Validation\ValidationSpec;

/**
 * The single-source specs compile to the exact Laravel rules the
 * FormRequests previously hardcoded. Any drift breaks both sides at
 * once — that is the point. Keys stay untranslated here (plain PHPUnit
 * has no translator); FormRequests apply __() at runtime.
 */
final class ValidationSpecTest extends TestCase
{
    public function test_builds_register_rules_with_db_backed_uniqueness(): void
    {
        $section = ValidationSpec::section('auth', 'register');

        $this->assertSame(['display_name', 'email', 'password'], array_keys($section['rules']));
        $this->assertContains('unique:users,email', $section['rules']['email']);
        $this->assertContains('confirmed', $section['rules']['password']);
        $this->assertSame('identity.validation.email_taken', $section['messageKeys']['email.unique']);
        $this->assertSame('identity.validation.password_confirmed', $section['messageKeys']['password.confirmed']);
    }

    public function test_builds_login_rules(): void
    {
        $section = ValidationSpec::section('auth', 'login');

        $this->assertSame(['email', 'password'], array_keys($section['rules']));
        $this->assertContains('email:rfc', $section['rules']['email']);
        $this->assertSame('identity.validation.email_required', $section['messageKeys']['email.required']);
    }

    public function test_builds_nested_profile_rules_with_wildcards(): void
    {
        $profile = ValidationSpec::section('profile', 'profile');

        $this->assertContains('required', $profile['rules']['contact.full_name']);
        $this->assertContains('regex:/^\+[1-9]\d{7,14}$/', $profile['rules']['contact.phone']);
        $this->assertContains('in:beginner,intermediate,advanced,expert', $profile['rules']['skills.*.level']);
        $this->assertContains('date_format:Y-m', $profile['rules']['experience.*.start_date']);
        $this->assertContains('required', $profile['rules']['experience.*.bullets.*']);
        $this->assertSame('profile.validation.skill_level_in', $profile['messageKeys']['skills.*.level.in']);

        $maxYear = (int) date('Y') + 5;
        $this->assertContains("max:{$maxYear}", $profile['rules']['education.*.end_year']);
        $this->assertContains('min:1950', $profile['rules']['education.*.start_year']);
    }

    public function test_unknown_context_yields_empty_rules(): void
    {
        $this->assertSame([], ValidationSpec::section('nope', 'nope')['rules']);
    }

    public function test_builds_source_rules_with_shared_dsl_types(): void
    {
        $source = ValidationSpec::section('sources', 'source');

        $this->assertSame(
            ['name', 'url', 'type', 'priority', 'country_code', 'is_enabled'],
            array_keys($source['rules'])
        );
        $this->assertContains('max:120', $source['rules']['name']);
        $this->assertContains('url', $source['rules']['url']);
        $this->assertContains('in:search_engine,board,ats,career_page', $source['rules']['type']);
        $this->assertContains('in:T1,T2,T3', $source['rules']['priority']);
        $this->assertContains('boolean', $source['rules']['is_enabled']);
        $this->assertContains('required', $source['rules']['is_enabled']);
        $this->assertSame('config.validation.type_in', $source['messageKeys']['type.in']);
        $this->assertSame('config.validation.enabled_boolean', $source['messageKeys']['is_enabled.boolean']);
    }
}
