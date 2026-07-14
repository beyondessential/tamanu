import { getCompleteRegistrationConditions } from './programRegistration';

describe('getCompleteRegistrationConditions', () => {
  const complete = { condition: { value: 'condition-a' }, category: { value: 'category-a' } };

  it('keeps rows that have both a condition and a category', () => {
    expect(getCompleteRegistrationConditions([complete])).toEqual([complete]);
  });

  it('drops the blank placeholder row left by "Add additional"', () => {
    // Regression guard: an incomplete row must not be saved, otherwise the submit
    // loop throws after the registration is saved and re-submitting duplicates it.
    const incomplete: any[] = [
      undefined,
      { condition: { value: 'condition-a' } }, // no category
      { category: { value: 'category-a' } }, // no condition
      { condition: { value: '' }, category: { value: 'category-a' } }, // empty condition value
    ];
    expect(getCompleteRegistrationConditions([complete, ...incomplete])).toEqual([complete]);
  });

  it('handles missing/empty condition lists', () => {
    expect(getCompleteRegistrationConditions(undefined)).toEqual([]);
    expect(getCompleteRegistrationConditions(null)).toEqual([]);
    expect(getCompleteRegistrationConditions([])).toEqual([]);
  });
});
