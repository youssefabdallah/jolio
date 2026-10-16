<?php

declare(strict_types=1);

namespace Src\Config\Domain\Enums;

/**
 * Where a job source fetches from (Stitch "Sources — Edit entry" TYPE control).
 *
 * Closed set: free-text types would break run routing (API client vs
 * crawler vs career-page parser) and the registry filter tabs.
 */
enum SourceType: string
{
    case SearchEngine = 'search_engine';
    case Board = 'board';
    case Ats = 'ats';
    case CareerPage = 'career_page';

    /**
     * Locale key for the human label (translated in Presentation).
     */
    public function translationKey(): string
    {
        return "config.enums.source_type.{$this->value}";
    }
}
