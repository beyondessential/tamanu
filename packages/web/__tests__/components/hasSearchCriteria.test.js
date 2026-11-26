import { describe, expect, it } from 'vitest';
import { hasSearchCriteria } from '../../app/components/SearchBar/hasSearchCriteria';

describe('hasSearchCriteria', () => {
  it('has none when every field is blank', () => {
    expect(hasSearchCriteria({})).toBe(false);
    expect(hasSearchCriteria({ firstName: '', villageId: null, sex: undefined })).toBe(false);
  });

  it('treats a field of only spaces as blank', () => {
    expect(hasSearchCriteria({ firstName: '   ' })).toBe(false);
  });

  it('does not count "Include deceased patients" as a criterion on its own', () => {
    expect(hasSearchCriteria({ deceased: true })).toBe(false);
    expect(hasSearchCriteria({ deceased: true, lastName: 'Ngata' })).toBe(true);
  });

  it('counts any filled field, including advanced and additional ones', () => {
    expect(hasSearchCriteria({ displayId: 'ABC123' })).toBe(true);
    expect(hasSearchCriteria({ sex: 'female' })).toBe(true);
    expect(hasSearchCriteria({ dateOfBirthFrom: '1990-01-01' })).toBe(true);
    expect(hasSearchCriteria({ secondaryIdentifier: 'X9' })).toBe(true);
  });
});
