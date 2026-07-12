import { describe, expect, it } from 'vitest';

// Focused regression test for the translation search predicate in
// packages/web/app/views/administration/translation/TranslationForm.jsx.
//
// The predicate is inline (non-exported) inside a useMemo, so this test mirrors
// the EXACT expression from the fixed source: it escapes every regex
// metacharacter in the raw search value before building the RegExp, then
// matches stringIds from the start or after a "." delimiter.
//
// Pre-fix the code did `searchValue.replace('.', '\\.')`, which:
//   - only escaped the first ".", and no other metacharacters, so a stray "("
//     or "[" threw "Invalid regular expression" during render; and
//   - left additional dots unescaped, so "." acted as a wildcard.
const matchesSearch = (stringId, searchValue) => {
  const escapedSearch = searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return Boolean(stringId.match(new RegExp(`(?:^|\\.)${escapedSearch}`, 'i')));
};

describe('translation search regex escaping', () => {
  it('does not throw when the search value contains an unbalanced "("', () => {
    // Pre-fix: `new RegExp('(?:^|\\.)report(status')` throws a SyntaxError.
    expect(() => matchesSearch('report.status', 'report(status')).not.toThrow();
    expect(matchesSearch('report.status', 'report(status')).toBe(false);
  });

  it('does not throw for other unescaped metacharacters like "[" and "*"', () => {
    expect(() => matchesSearch('general.action.save', 'save[')).not.toThrow();
    expect(() => matchesSearch('general.action.save', 'save*')).not.toThrow();
  });

  it('treats "." as a literal delimiter, not a wildcard', () => {
    // "action.save" should match the literal segment "action.save"...
    expect(matchesSearch('general.action.save', 'action.save')).toBe(true);
    // ...but must NOT match when the "." stands in for an arbitrary character
    // (pre-fix the unescaped "." would wildcard-match "actionXsave").
    expect(matchesSearch('general.actionXsave.thing', 'action.save')).toBe(false);
  });

  it('still matches from the start of the stringId or after a "." delimiter', () => {
    expect(matchesSearch('general.action.save', 'general')).toBe(true);
    expect(matchesSearch('general.action.save', 'action')).toBe(true);
    // "ction" is mid-segment, so it should not match.
    expect(matchesSearch('general.action.save', 'ction')).toBe(false);
  });
});
