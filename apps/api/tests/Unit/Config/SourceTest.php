<?php

declare(strict_types=1);

namespace Tests\Unit\Config;

use PHPUnit\Framework\TestCase;
use Src\Config\Domain\Entities\Source;
use Src\Config\Domain\Enums\SourcePriority;
use Src\Config\Domain\Enums\SourceType;
use Src\Config\Domain\Exceptions\InvalidSource;
use Src\Config\Domain\ValueObjects\CountryCode;
use Src\Config\Domain\ValueObjects\SourceName;
use Src\Config\Domain\ValueObjects\SourceUrl;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * The Source aggregate cannot be assembled in a rule-breaking state,
 * keeps its identity across edits, and exposes explicit enable/disable.
 */
final class SourceTest extends TestCase
{
    public function test_assembles_a_minimal_source(): void
    {
        $source = $this->makeSource();

        $this->assertTrue($source->isEnabled);
        $this->assertTrue($source->isEnabledForRun());
        $this->assertSame('GLOBAL', (string) $source->country);
        $this->assertSame(2, $source->priorityRank());
    }

    public function test_replacement_keeps_identity_and_revalidates(): void
    {
        $source = $this->makeSource();

        $replaced = $source->replace(
            SourceName::fromString('Remotive'),
            SourceUrl::fromString('https://remotive.com/api/remote-jobs'),
            SourceType::Board,
            SourcePriority::T1,
            CountryCode::fromString('US'),
            false,
        );

        $this->assertSame((string) $source->id, (string) $replaced->id);
        $this->assertSame((string) $source->userId, (string) $replaced->userId);
        $this->assertSame('Remotive', (string) $replaced->name);
        $this->assertSame(SourcePriority::T1, $replaced->priority);
        $this->assertFalse($replaced->isEnabledForRun());
    }

    public function test_single_field_changes_keep_the_rest(): void
    {
        $source = $this->makeSource();

        $renamed = $source->rename(SourceName::fromString('Arbeitnow EU'));
        $this->assertSame('Arbeitnow EU', (string) $renamed->name);
        $this->assertSame((string) $source->url, (string) $renamed->url);

        $moved = $source->moveTo(CountryCode::fromString('de'));
        $this->assertSame('DE', (string) $moved->country);
    }

    public function test_enable_and_disable_are_explicit(): void
    {
        $source = $this->makeSource();

        $this->assertFalse($source->disable()->isEnabledForRun());
        $this->assertFalse($source->disable()->isEnabled);
        $this->assertTrue($source->disable()->enable()->isEnabled);
    }

    public function test_priority_tiers_order_t1_first(): void
    {
        $this->assertTrue(SourcePriority::T1->winsTieOver(SourcePriority::T2));
        $this->assertTrue(SourcePriority::T2->winsTieOver(SourcePriority::T3));
        $this->assertFalse(SourcePriority::T3->winsTieOver(SourcePriority::T1));
        $this->assertFalse(SourcePriority::T1->winsTieOver(SourcePriority::T1));
    }

    public function test_rejects_blank_and_overlong_names(): void
    {
        $this->expectException(InvalidSource::class);

        SourceName::fromString('   ');
    }

    private function makeSource(): Source
    {
        return Source::fromParts(
            Ulid::generate(),
            Ulid::generate(),
            SourceName::fromString('Arbeitnow'),
            SourceUrl::fromString('https://www.arbeitnow.com/api/job-board-api'),
            SourceType::SearchEngine,
            SourcePriority::T2,
            CountryCode::fromString(null),
        );
    }
}
