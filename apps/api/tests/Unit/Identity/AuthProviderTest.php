<?php

declare(strict_types=1);

namespace Tests\Unit\Identity;

use PHPUnit\Framework\TestCase;
use Src\Identity\Domain\Enums\AuthProvider;

/**
 * The provider enum distinguishes local credentials from OAuth.
 */
final class AuthProviderTest extends TestCase
{
    public function test_local_is_the_only_non_oauth_provider(): void
    {
        $this->assertFalse(AuthProvider::Local->isOAuth());
        $this->assertTrue(AuthProvider::Google->isOAuth());
    }

    public function test_backing_values(): void
    {
        $this->assertSame('local', AuthProvider::Local->value);
        $this->assertSame('google', AuthProvider::Google->value);
    }
}
