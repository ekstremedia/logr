/**
 * SearchQuery value object representing a search term for filtering logs.
 * Supports both plain text and regex search.
 */
export type SearchMode = 'text' | 'regex';

export class SearchQuery {
  public readonly value: string;
  public readonly mode: SearchMode;
  public readonly caseSensitive: boolean;
  private readonly compiledRegex: RegExp | null;

  private constructor(value: string, mode: SearchMode, caseSensitive: boolean) {
    this.value = value;
    this.mode = mode;
    this.caseSensitive = caseSensitive;

    if (mode === 'regex' && value) {
      try {
        this.compiledRegex = new RegExp(value, caseSensitive ? '' : 'i');
      } catch {
        this.compiledRegex = null;
      }
    } else {
      this.compiledRegex = null;
    }

    Object.freeze(this);
  }

  /**
   * Creates a text search query.
   * @param value - The search text
   * @param caseSensitive - Whether to match case (default: false)
   * @returns A new SearchQuery instance
   */
  static text(value: string, caseSensitive = false): SearchQuery {
    return new SearchQuery(value, 'text', caseSensitive);
  }

  /**
   * Creates a regex search query.
   * @param pattern - The regex pattern
   * @param caseSensitive - Whether to match case (default: false)
   * @returns A new SearchQuery instance
   */
  static regex(pattern: string, caseSensitive = false): SearchQuery {
    return new SearchQuery(pattern, 'regex', caseSensitive);
  }

  /**
   * Creates an empty search query.
   * @returns A new empty SearchQuery instance
   */
  static empty(): SearchQuery {
    return new SearchQuery('', 'text', false);
  }

  /**
   * Checks if this query is empty.
   * @returns True if the query has no value
   */
  isEmpty(): boolean {
    return this.value.length === 0;
  }

  /**
   * Checks if the regex is valid (for regex mode).
   * @returns True if the regex compiles successfully or is text mode
   */
  isValid(): boolean {
    if (this.mode === 'text') return true;
    if (this.isEmpty()) return true;
    return this.compiledRegex !== null;
  }

  /**
   * Tests if the query matches the given text.
   * @param text - The text to test against
   * @returns True if the text matches the query
   */
  matches(text: string): boolean {
    if (this.isEmpty()) return true;

    if (this.mode === 'regex') {
      if (!this.compiledRegex) return false;
      return this.compiledRegex.test(text);
    }

    // Text search
    const searchText = this.caseSensitive ? text : text.toLowerCase();
    const searchValue = this.caseSensitive ? this.value : this.value.toLowerCase();
    return searchText.includes(searchValue);
  }

  /**
   * Creates a copy with a new value.
   * @param value - The new search value
   * @returns A new SearchQuery with the updated value
   */
  withValue(value: string): SearchQuery {
    return new SearchQuery(value, this.mode, this.caseSensitive);
  }

  /**
   * Creates a copy with a new mode.
   * @param mode - The new search mode
   * @returns A new SearchQuery with the updated mode
   */
  withMode(mode: SearchMode): SearchQuery {
    return new SearchQuery(this.value, mode, this.caseSensitive);
  }

  /**
   * Creates a copy with case sensitivity toggled.
   * @returns A new SearchQuery with toggled case sensitivity
   */
  toggleCaseSensitive(): SearchQuery {
    return new SearchQuery(this.value, this.mode, !this.caseSensitive);
  }

  /**
   * Creates a copy with regex mode toggled.
   * @returns A new SearchQuery with toggled mode
   */
  toggleRegex(): SearchQuery {
    return new SearchQuery(
      this.value,
      this.mode === 'regex' ? 'text' : 'regex',
      this.caseSensitive
    );
  }

  equals(other: SearchQuery): boolean {
    return (
      this.value === other.value &&
      this.mode === other.mode &&
      this.caseSensitive === other.caseSensitive
    );
  }
}
