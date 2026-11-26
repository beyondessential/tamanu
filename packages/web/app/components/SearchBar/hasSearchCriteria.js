// "Include deceased patients" widens a search rather than being a criterion of its own.
const MODIFIER_FIELDS = ['deceased'];

const isFilledIn = value => {
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== false;
};

export const hasSearchCriteria = (values = {}) =>
  Object.entries(values).some(
    ([field, value]) => !MODIFIER_FIELDS.includes(field) && isFilledIn(value),
  );
