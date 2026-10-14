<?php

declare(strict_types=1);

namespace Tests\Unit\Identity;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use Src\Identity\Domain\Exceptions\InvalidUser;
use Src\Identity\Domain\ValueObjects\Email;

/**
 * The Email value object only accepts well-formed addresses.
 */
final class EmailTest extends TestCase
{
    public function test_accepts_a_valid_address_and_normalizes_it(): void
    {
        $email = Email::fromString('  Alex@Dev.Internal ');

        $this->assertSame('alex@dev.internal', (string) $email);
    }

    #[DataProvider('invalidAddresses')]
    public function test_rejects_malformed_addresses(string $value): void
    {
        $this->expectException(InvalidUser::class);

        Email::fromString($value);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidAddresses(): array
    {
        return [
            'blank' => [''],
            'whitespace' => ['   '],
            'no at-sign' => ['alexdev.internal'],
            'no domain' => ['alex@'],
            'no local part' => ['@dev.internal'],
        ];
    }

    public function test_equality_is_value_based(): void
    {
        $this->assertTrue(Email::fromString('a@b.co')->equals(Email::fromString('A@B.CO')));
    }
}
