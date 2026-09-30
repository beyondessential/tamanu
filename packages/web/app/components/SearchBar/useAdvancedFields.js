import { useCallback, useEffect, useState } from 'react';

// A multiselect whose chips have all been removed persists as [], which is not a filter.
const isFilledIn = (value) => (Array.isArray(value) ? value.length > 0 : Boolean(value));

export const useAdvancedFields = (advancedFields, searchParameters) => {
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  // If one of the advanced fields is filled in when landing on the screen,
  // show the advanced fields section
  const defaultFilterOpen = useCallback(() => {
    return Object.keys(searchParameters || {})
      .filter((key) => isFilledIn(searchParameters[key]))
      .some((value) => advancedFields.includes(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedFields]);

  useEffect(() => {
    setShowAdvancedFields(defaultFilterOpen());
  }, [defaultFilterOpen]);

  return { showAdvancedFields, setShowAdvancedFields };
};
