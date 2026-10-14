<?php

declare(strict_types=1);

namespace Tests\Feature\Identity;

use Tests\TestCase;

/**
 * Every translation key in the default locale must exist in all
 * supported locales (backend skill §5). Missing keys = incomplete feature.
 */
final class LangParityTest extends TestCase
{
    /**
     * @return array<string, list<string>>
     */
    private function flattenedKeys(string $locale): array
    {
        $flatten = function (array $values, string $prefix) use (&$flatten): array {
            $keys = [];
            foreach ($values as $key => $value) {
                $path = $prefix === '' ? (string) $key : $prefix.'.'.$key;
                if (is_array($value)) {
                    array_push($keys, ...$flatten($value, $path));
                } else {
                    $keys[] = $path;
                }
            }

            return $keys;
        };

        $keys = [];
        foreach (glob(lang_path("{$locale}/*.php")) ?: [] as $file) {
            $group = basename($file, '.php');
            $values = require $file;
            array_push($keys, ...$flatten(is_array($values) ? $values : [], $group));
        }
        sort($keys);

        return $keys;
    }

    public function test_identity_keys_match_across_locales(): void
    {
        $this->assertSame(
            $this->flattenedKeys('en'),
            $this->flattenedKeys('fr'),
            'lang/fr/identity.php is missing keys present in lang/en/identity.php (or vice versa).',
        );
        $this->assertNotEmpty($this->flattenedKeys('en'));
    }
}
