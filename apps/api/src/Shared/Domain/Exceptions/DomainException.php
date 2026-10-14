<?php

declare(strict_types=1);

namespace Src\Shared\Domain\Exceptions;

use Src\Shared\Domain\Enums\ErrorCode;

/**
 * Base class for domain-layer business-rule violations.
 *
 * Carries a machine-readable ErrorCode plus a translation key with context
 * so Presentation can render a localized API error. Carries no HTTP status
 * itself: the status lives on the ErrorCode enum, consumed centrally by
 * the API exception renderer.
 */
abstract class DomainException extends \DomainException
{
    public function __construct(
        public readonly ErrorCode $errorCode,
        public readonly string $translationKey,
        public readonly array $context = [],
    ) {
        parent::__construct($translationKey);
    }
}
