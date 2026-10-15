/** Regional-indicator flag emoji for an ISO country code. */
export function countryFlag(code: string): string {
  return String.fromCodePoint(...[...code.toUpperCase()].map((char) => 127397 + char.charCodeAt(0)));
}

/** ISO codes hidden from every country picker in this app. */
export const EXCLUDED_COUNTRY_CODES: readonly string[] = ["IL"];
