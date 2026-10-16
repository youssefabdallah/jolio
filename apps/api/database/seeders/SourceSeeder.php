<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Src\Config\Infrastructure\Persistence\Eloquent\Source;
use Src\Identity\Infrastructure\Persistence\Eloquent\User;
use Src\Shared\Domain\ValueObjects\Ulid;

/**
 * Starter job-source registry (SPECS FR-39, US-302).
 *
 * Inserts the same 20 curated entries for every existing account, so
 * a fresh user starts from a working registry instead of a blank
 * table. Safe to re-run: rows match on (user_id, name) and existing
 * rows are left untouched, so user customizations are never clobbered.
 * Creates no accounts itself — run after registering.
 *
 * Run standalone:
 *   php artisan db:seed --class=Database\\Seeders\\SourceSeeder --force
 */
class SourceSeeder extends Seeder
{
    public function run(): void
    {
        $userIds = User::query()->pluck('id')->all();

        if ($userIds === []) {
            $this->command->warn('No users found — register an account first, then re-run the seeder.');

            return;
        }

        foreach ($userIds as $userId) {
            foreach ($this->rows() as $row) {
                Source::query()->firstOrCreate(
                    ['user_id' => (string) $userId, 'name' => $row['name']],
                    [...$row, 'id' => (string) Ulid::generate(), 'user_id' => (string) $userId],
                );
            }
        }

        $this->command->info(sprintf('Seeded %d sources for %d user(s).', count($this->rows()), count($userIds)));
    }

    /**
     * Curated starter entries: keyless API feeds, major boards, ATS
     * APIs, and two company career pages. Tiers reflect reliability
     * from the reference project (T1 queried first, wins dedup ties).
     *
     * @return list<array{name: string, url: string, type: string, priority: string, country_code: string, is_enabled: bool}>
     */
    private function rows(): array
    {
        return [
            ['name' => 'Arbeitnow', 'url' => 'https://www.arbeitnow.com/api/job-board-api', 'type' => 'search_engine', 'priority' => 'T1', 'country_code' => 'DE', 'is_enabled' => true],
            ['name' => 'Remotive', 'url' => 'https://remotive.com/api/remote-jobs', 'type' => 'search_engine', 'priority' => 'T1', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'RemoteOK', 'url' => 'https://remoteok.com/api', 'type' => 'board', 'priority' => 'T2', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'WeWorkRemotely', 'url' => 'https://weworkremotely.com/categories/rss', 'type' => 'board', 'priority' => 'T1', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'Greenhouse', 'url' => 'https://boards-api.greenhouse.io/v1/boards', 'type' => 'ats', 'priority' => 'T1', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'Lever', 'url' => 'https://api.lever.co/v0/postings', 'type' => 'ats', 'priority' => 'T2', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'Ashby', 'url' => 'https://api.ashbyhq.com/posting-api/job-board', 'type' => 'ats', 'priority' => 'T2', 'country_code' => 'US', 'is_enabled' => true],
            ['name' => 'Wellfound', 'url' => 'https://wellfound.com/jobs', 'type' => 'board', 'priority' => 'T2', 'country_code' => 'US', 'is_enabled' => true],
            ['name' => 'Y Combinator Jobs', 'url' => 'https://www.ycombinator.com/jobs', 'type' => 'board', 'priority' => 'T2', 'country_code' => 'US', 'is_enabled' => true],
            ['name' => 'Otta', 'url' => 'https://otta.com/jobs', 'type' => 'board', 'priority' => 'T2', 'country_code' => 'GB', 'is_enabled' => true],
            ['name' => 'Berlin Startup Jobs', 'url' => 'https://berlinstartupjobs.com', 'type' => 'board', 'priority' => 'T2', 'country_code' => 'DE', 'is_enabled' => true],
            ['name' => 'Relocate.me', 'url' => 'https://relocate.me/search', 'type' => 'search_engine', 'priority' => 'T3', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'EU Remote Jobs', 'url' => 'https://euremotejobs.com', 'type' => 'search_engine', 'priority' => 'T3', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'Landing.jobs', 'url' => 'https://landing.jobs/jobs', 'type' => 'board', 'priority' => 'T3', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'Dice', 'url' => 'https://www.dice.com/jobs', 'type' => 'board', 'priority' => 'T3', 'country_code' => 'US', 'is_enabled' => true],
            ['name' => 'Authentic Jobs', 'url' => 'https://authenticjobs.com', 'type' => 'board', 'priority' => 'T3', 'country_code' => 'US', 'is_enabled' => true],
            ['name' => 'Crypto Jobs List', 'url' => 'https://cryptojobslist.com', 'type' => 'board', 'priority' => 'T3', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'Workable', 'url' => 'https://www.workable.com', 'type' => 'ats', 'priority' => 'T3', 'country_code' => 'GLOBAL', 'is_enabled' => true],
            ['name' => 'SmartRecruiters', 'url' => 'https://api.smartrecruiters.com/v1/companies/postings', 'type' => 'ats', 'priority' => 'T3', 'country_code' => 'US', 'is_enabled' => true],
            ['name' => 'Zalando Careers', 'url' => 'https://jobs.zalando.com', 'type' => 'career_page', 'priority' => 'T3', 'country_code' => 'DE', 'is_enabled' => true],
        ];
    }
}
