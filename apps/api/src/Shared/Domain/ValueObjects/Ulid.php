<?php

declare(strict_types=1);

namespace Src\Shared\Domain\ValueObjects;

/**
 * ULID identifier (26-char Crockford base32, lexicographically sortable).
 *
 * Pure-PHP generation so the Domain can mint identifiers without any
 * framework dependency. Used as primary key for Identity aggregates.
 */
final class Ulid
{
    private const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

    private const PATTERN = '/^[0-9A-HJKMNP-TV-Z]{26}$/i';

    private function __construct(private readonly string $value) {}

    /**
     * Mint a new ULID from the current time plus cryptographic randomness.
     */
    public static function generate(): self
    {
        $milliseconds = (int) (microtime(true) * 1000);
        // 6 time bytes (48 bits) + 10 random bytes (80 bits) = 128 bits.
        // Prepended by 2 zero bits to fill 26 x 5-bit groups exactly.
        $data = substr(pack('J', $milliseconds), -6).random_bytes(10);

        $buffer = 0;
        $bufferedBits = 2;
        $encoded = '';
        foreach (str_split($data) as $byte) {
            $buffer = ($buffer << 8) | ord($byte);
            $bufferedBits += 8;
            while ($bufferedBits >= 5) {
                $bufferedBits -= 5;
                $encoded .= self::ALPHABET[($buffer >> $bufferedBits) & 31];
            }
        }

        return new self($encoded);
    }

    /**
     * Reconstitute a ULID from storage, rejecting malformed values.
     *
     * @throws \InvalidArgumentException
     */
    public static function fromString(string $value): self
    {
        $normalized = strtoupper($value);

        if (preg_match(self::PATTERN, $normalized) !== 1) {
            throw new \InvalidArgumentException("Invalid ULID: {$value}");
        }

        return new self($normalized);
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
