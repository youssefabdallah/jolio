<?php

declare(strict_types=1);

namespace Src\Shared\Application\Validation;

/**
 * Single-source validation specs shared with the SPA (see
 * shared/validation/*.json at the monorepo root).
 *
 * FormRequests build their rules() and messages() from here instead
 * of hardcoding them, so a spec edit updates Laravel validation and
 * — through the same files — the TypeScript yup schemas. Rules the
 * browser cannot enforce (DB uniqueness) are marked serverOnly and
 * skipped by the TS builder.
 */
final class ValidationSpec
{
    /**
     * @var array<string, mixed>|null
     */
    private static ?array $cache = [];

    /**
     * Step-scoped subset: only rules whose top-level segment is listed.
     * Powers per-step PUTs — a step validates its own section, never
     * the whole document.
     *
     * @param  list<string>  $segments
     * @return array{rules: array<string, mixed>, messageKeys: array<string, string>}
     */
    public static function pick(string $context, string $section, array $segments): array
    {
        $full = self::section($context, $section);

        $rules = [];
        foreach ($full['rules'] as $path => $fieldRules) {
            if (in_array(explode('.', (string) $path)[0], $segments, true)) {
                $rules[$path] = $fieldRules;
            }
        }

        $messages = [];
        foreach ($full['messageKeys'] as $path => $key) {
            if (in_array(explode('.', (string) $path)[0], $segments, true)) {
                $messages[$path] = $key;
            }
        }

        return ['rules' => $rules, 'messageKeys' => $messages];
    }

    /**
     * Laravel rule list for one spec section, with message KEYS per
     * field.rule (callers translate via __() where the app is booted —
     * never here, so plain-PHPUnit tests stay framework-free).
     *
     * @return array{rules: array<string, mixed>, messageKeys: array<string, string>}
     */
    public static function section(string $context, string $section): array
    {
        $spec = self::load($context);

        /** @var array<string, mixed> $fields */
        $fields = $spec['sections'][$section] ?? [];

        $rules = [];
        $messages = [];
        self::flatten($fields, '', $rules, $messages);

        return ['rules' => $rules, 'messageKeys' => $messages];
    }

    /**
     * @param  array<string, mixed>  $fields
     * @param  array<string, mixed>  $rules
     * @param  array<string, string>  $messages
     */
    private static function flatten(array $fields, string $prefix, array &$rules, array &$messages): void
    {
        foreach ($fields as $name => $definition) {
            /** @var array<string, mixed> $definition */
            $path = $prefix === '' ? (string) $name : "{$prefix}.{$name}";
            /** @var array<string, mixed> $fieldRules */
            $fieldRules = $definition['rules'] ?? [];
            $rules[$path] = self::toLaravelRules($fieldRules);

            /** @var array<string, string> $fieldMessages */
            $fieldMessages = $definition['messages'] ?? [];
            foreach ($fieldMessages as $rule => $key) {
                $messages["{$path}.{$rule}"] = (string) $key;
            }

            if (isset($definition['fields']) && is_array($definition['fields'])) {
                /** @var array<string, mixed> $nested */
                $nested = $definition['fields'];
                self::flatten($nested, $path, $rules, $messages);
            }

            if (isset($definition['items']) && is_array($definition['items'])) {
                /** @var array<string, mixed> $items */
                $items = $definition['items'];
                if (array_key_exists('rules', $items)) {
                    $itemPath = "{$path}.*";
                    /** @var array<string, mixed> $itemRules */
                    $itemRules = $items['rules'];
                    $rules[$itemPath] = self::toLaravelRules($itemRules);
                    /** @var array<string, string> $itemMessages */
                    $itemMessages = $items['messages'] ?? [];
                    foreach ($itemMessages as $rule => $key) {
                        $messages["{$itemPath}.{$rule}"] = (string) $key;
                    }
                } else {
                    self::flatten($items, "{$path}.*", $rules, $messages);
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>  $fieldRules
     * @return list<string>
     */
    private static function toLaravelRules(array $fieldRules): array
    {
        $out = [];

        foreach ($fieldRules as $rule => $value) {
            if ($rule === 'serverOnly') {
                continue;
            }

            $out[] = match ($rule) {
                'required' => $value ? 'required' : 'nullable',
                'nullable' => $value ? 'nullable' : null,
                'string', 'integer', 'array', 'url', 'confirmed' => $rule,
                'email' => $value === true ? 'email' : "email:{$value}",
                // E.164 shape (the SPA additionally proves the number is
                // really diallable with libphonenumber-js).
                'phone' => 'regex:/^\+[1-9]\d{7,14}$/',
                'min', 'max' => "{$rule}:".self::bound($value),
                'in' => 'in:'.implode(',', (array) $value),
                'date_format' => "date_format:{$value}",
                'unique' => "unique:{$value}",
                default => null,
            };
        }

        return array_values(array_filter($out, fn (?string $rule): bool => $rule !== null));
    }

    private static function bound(mixed $value): string|int
    {
        if (is_array($value) && isset($value['offset_from_current_year'])) {
            return (int) date('Y') + (int) $value['offset_from_current_year'];
        }

        return $value;
    }

    /**
     * @return array<string, mixed>
     */
    private static function load(string $context): array
    {
        if (! isset(self::$cache[$context])) {
            // Pure-PHP path resolution (no base_path()): plain-PHPUnit
            // tests have no application instance. Probe several depths:
            // container layout keeps shared/validation inside the app
            // dir, the monorepo keeps it one level above the app dir.
            $candidates = [
                dirname(__DIR__, 4)."/shared/validation/{$context}.json",
                dirname(__DIR__, 5)."/shared/validation/{$context}.json",
                dirname(__DIR__, 6)."/shared/validation/{$context}.json",
            ];

            foreach ($candidates as $path) {
                if (is_file($path)) {
                    /** @var array<string, mixed> $decoded */
                    $decoded = json_decode((string) file_get_contents($path), true);
                    self::$cache[$context] = $decoded;

                    break;
                }
            }

            self::$cache[$context] ??= ['sections' => []];
        }

        return self::$cache[$context];
    }
}
