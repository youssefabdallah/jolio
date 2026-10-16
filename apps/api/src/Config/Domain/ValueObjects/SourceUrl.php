<?php

declare(strict_types=1);

namespace Src\Config\Domain\ValueObjects;

use Src\Config\Domain\Exceptions\InvalidSource;

/**
 * Fetch URL of one job source (Stitch URL field).
 *
 * Shape-only validation lives here: required, valid URL, https scheme,
 * bounded length. Reachability and the SSRF guard (no private or
 * link-local IPs, capped redirects/size/timeout per ROADMAP S5) belong
 * to the infrastructure fetcher, which can actually resolve DNS — the
 * Domain never performs network I/O.
 */
final class SourceUrl
{
    public const MAX_LENGTH = 2048;

    private function __construct(public readonly string $value) {}

    /**
     * @throws InvalidSource
     */
    public static function fromString(string $url): self
    {
        $url = trim($url);

        if ($url === '') {
            throw InvalidSource::blankValue('url');
        }

        if (mb_strlen($url) > self::MAX_LENGTH) {
            throw InvalidSource::tooLong('url', self::MAX_LENGTH);
        }

        if (filter_var($url, FILTER_VALIDATE_URL) === false) {
            throw InvalidSource::badUrl('url', $url);
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        $host = (string) parse_url($url, PHP_URL_HOST);

        if ($scheme !== 'https' || $host === '') {
            throw InvalidSource::badUrl('url', $url);
        }

        return new self($url);
    }

    /**
     * Lowercased host for logging and future SSRF-guard diagnostics.
     */
    public function host(): string
    {
        return strtolower((string) parse_url($this->value, PHP_URL_HOST));
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
