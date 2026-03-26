import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { getScopedSchema, isSetting } from '@tamanu/settings';
import { formatSettingName } from './EditorView';

const ALL_SCOPES = [SETTINGS_SCOPES.GLOBAL, SETTINGS_SCOPES.CENTRAL, SETTINGS_SCOPES.FACILITY];

/**
 * Recursively traverses a settings schema and yields flat records for every leaf setting.
 * Each record contains enough information to display and navigate to the setting.
 */
const collectSettings = (schema, scope, path = '', categoryPath = []) => {
  if (!schema?.properties) return [];

  return Object.entries(schema.properties).flatMap(([key, value]) => {
    const newPath = path ? `${path}.${key}` : key;
    const displayName = formatSettingName(value.name, key);

    if (isSetting(value)) {
      // Leaf setting.
      // NOTE: name and description come directly from the settings schema as authored
      // English strings — they are not run through the translation system. The search
      // index therefore only covers the untranslated text. If settings schema strings
      // are ever translated, this index will need to incorporate those translations.
      //
      // Because all schema strings are developer-written ASCII English, a few related
      // simplifications are also safe for now:
      //   - toLowerCase() rather than toLocaleLowerCase(): the locale-specific
      //     differences (e.g. Turkish dotless-i) do not arise in ASCII text.
      //   - No Unicode normalisation (NFC/NFD/NFKC): JS string literals are already
      //     NFC and the text never transits external sources that might vary.
      //   - Space-based word splitting (split(/\s+/)) rather than Intl.Segmenter:
      //     CJK and other scripts that omit word-spaces are not present in the data.
      // All three assumptions would need revisiting if the strings become translatable.
      return {
        scope,
        path: newPath,
        name: displayName,
        description: value.description ?? '',
        // categoryPath is [topCategory, subCategory?] within the scope schema
        categoryPath,
      };
    }

    // Nested category – recurse
    return collectSettings(value, scope, newPath, [...categoryPath, key]);
  });
};

/** Build the full flat list of all settings across all scopes, once. */
const buildSearchIndex = () =>
  ALL_SCOPES.flatMap(scope => {
    const schema = getScopedSchema(scope);
    return schema ? collectSettings(schema, scope) : [];
  });

/**
 * Score a single entry against the array of lower-cased query words.
 * Returns a positive number when the entry matches, 0 when it does not.
 *
 * Scoring rules (higher = better match):
 *   - Every query word must appear somewhere in the combined text (AND logic).
 *   - Name matches score higher than key/description-only matches.
 *   - Prefix / start-of-word matches score higher than mid-word matches.
 */
const scoreEntry = (entry, queryWords) => {
  if (queryWords.length === 0) return 0;

  const nameLower = entry.name.toLowerCase();
  const descLower = entry.description.toLowerCase();
  const pathLower = entry.path.toLowerCase();

  let totalScore = 0;

  for (const word of queryWords) {
    const inName = nameLower.includes(word);
    const inDesc = descLower.includes(word);
    const inPath = pathLower.includes(word);

    if (!inName && !inDesc && !inPath) return 0; // word is missing – no match

    // Base score for the word being present
    let wordScore = 1;

    if (inName) {
      wordScore += 2; // name is more important than description or key
      // Bonus for matching at a word boundary in the name
      if (new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(nameLower)) {
        wordScore += 2;
      }
    }

    totalScore += wordScore;
  }

  return totalScore;
};

/**
 * Hook that provides full-text search across all settings in all scopes.
 *
 * Returns:
 *   searchQuery       – the current (live) search string
 *   setSearchQuery    – setter (use this for the input's onChange)
 *   isSearchActive    – true when the query is non-empty
 *   searchResults     – sorted, filtered array of matching setting records
 *   clearSearch       – function to empty the query
 */
export const useSettingsSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [searchQuery, setSearchQueryState] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const debounceTimer = useRef(null);

  // Cancel any pending debounce timer on unmount
  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  // Build the index once and keep it stable for the lifetime of the hook.
  const searchIndex = useMemo(() => buildSearchIndex(), []);

  const setSearchQuery = useCallback(
    value => {
      setSearchQueryState(value);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        setDebouncedQuery(value);
        setSearchParams(value.trim() ? { q: value.trim() } : {}, { replace: true });
      }, 50);
    },
    [setSearchParams],
  );

  const clearSearch = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    setSearchQueryState('');
    setDebouncedQuery('');
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const searchResults = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return [];

    const queryWords = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

    const scored = [];
    for (const entry of searchIndex) {
      const score = scoreEntry(entry, queryWords);
      if (score > 0) {
        scored.push({ ...entry, score });
      }
    }

    // Sort by descending score, then alphabetically by name within the same score
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    return scored;
  }, [debouncedQuery, searchIndex]);

  // Derive from debouncedQuery to keep in sync with searchResults (both use the debounced value)
  const isSearchActive = debouncedQuery.trim().length > 0;

  return {
    searchQuery,
    setSearchQuery,
    isSearchActive,
    searchResults,
    clearSearch,
  };
};
