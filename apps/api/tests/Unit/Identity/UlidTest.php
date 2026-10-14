<?php

declare(strict_types=1);

namespace Tests\Unit\Identity;

use PHPUnit\Framework\TestCase;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * ULIDs are unique, well-formed, and survive a string roundtrip.
 */
final class UlidTest extends TestCase
{
    public function test_generates_a_26_char_crockford_string(): void
    {
        $ulid = (string) Ulid::generate();

        $this->assertMatchesRegularExpression('/^[0-9A-HJKMNP-TV-Z]{26}$/', $ulid);
    }

    public function test_generated_values_are_unique(): void
    {
        $this->assertNotSame((string) Ulid::generate(), (string) Ulid::generate());
    }

    public function test_roundtrips_through_string(): void
    {
        $ulid = Ulid::generate();

        $this->assertSame((string) $ulid, (string) Ulid::fromString((string) $ulid));
    }

    public function test_rejects_malformed_values(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        Ulid::fromString('not-a-ulid');
    }
}
