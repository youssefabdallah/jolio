<?php

declare(strict_types=1);

namespace Src\Profile\Domain\ValueObjects;

use Src\Profile\Domain\Enums\SkillLevel;
use Src\Profile\Domain\Exceptions\InvalidProfile;

/**
 * One grouped skill with a self-assessed level (SPECS §6 Profile).
 *
 * Group is free text ("Backend", "Languages", …) so candidates keep
 * their own taxonomy; only the level is a closed enum.
 */
final class Skill
{
    public const MAX_GROUP = 60;

    public const MAX_NAME = 80;

    private function __construct(
        public readonly string $group,
        public readonly string $name,
        public readonly SkillLevel $level,
    ) {}

    /**
     * @throws InvalidProfile
     */
    public static function fromPrimitives(string $group, string $name, string $level): self
    {
        $group = trim($group);
        $name = trim($name);

        if ($group === '') {
            throw InvalidProfile::blankValue('skills.group');
        }
        if ($name === '') {
            throw InvalidProfile::blankValue('skills.name');
        }
        if (mb_strlen($group) > self::MAX_GROUP) {
            throw InvalidProfile::tooLong('skills.group', self::MAX_GROUP);
        }
        if (mb_strlen($name) > self::MAX_NAME) {
            throw InvalidProfile::tooLong('skills.name', self::MAX_NAME);
        }

        $parsed = SkillLevel::tryFrom(strtolower(trim($level)));
        if ($parsed === null) {
            throw InvalidProfile::unknownLevel('skills.level', $level);
        }

        return new self($group, $name, $parsed);
    }
}
