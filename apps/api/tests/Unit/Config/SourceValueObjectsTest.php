<?php

declare(strict_types=1);

namespace Tests\Unit\Config;

use PHPUnit\Framework\TestCase;
use Src\Config\Domain\Enums\SourcePriority;
use Src\Config\Domain\Enums\SourceType;
use Src\Config\Domain\Exceptions\InvalidSource;
use Src\Config\Domain\ValueObjects\CountryCode;
use Src\Config\Domain\ValueObjects\SourceUrl;

/**
 * Source value objects reject bad shapes at construction time.
 */
final class SourceValueObjectsTest extends TestCase
{
    public function test_url_requires_https(): void
    {
        $this->assertSame(
            'https://www.arbeitnow.com/api/job-board-api',
            (string) SourceUrl::fromString('https://www.arbeitnow.com/api/job-board-api')
        );

        $this->expectException(InvalidSource::class);

        SourceUrl::fromString('http://www.arbeitnow.com/api/job-board-api');
    }

    public function test_url_rejects_non_urls_and_overlong_values(): void
    {
        try {
            SourceUrl::fromString('not-a-url');
            $this->fail('Expected InvalidSource for a non-URL.');
        } catch (InvalidSource $e) {
            $this->assertSame('INVALID_SOURCE_VALUE', $e->errorCode->value);
        }

        $this->expectException(InvalidSource::class);

        SourceUrl::fromString('https://example.com/'.str_repeat('a', SourceUrl::MAX_LENGTH));
    }

    public function test_country_defaults_to_global(): void
    {
        $this->assertTrue(CountryCode::fromString(null)->isGlobal());
        $this->assertTrue(CountryCode::fromString('')->isGlobal());
        $this->assertTrue(CountryCode::fromString('global')->isGlobal());
        $this->assertSame('DE', (string) CountryCode::fromString('de'));
    }

    public function test_country_rejects_malformed_codes(): void
    {
        $this->expectException(InvalidSource::class);

        CountryCode::fromString('GER');
    }

    public function test_enums_expose_translation_keys(): void
    {
        $this->assertSame('config.enums.source_type.search_engine', SourceType::SearchEngine->translationKey());
        $this->assertSame('config.enums.source_priority.T1', SourcePriority::T1->translationKey());
    }
}
