import { useEffect, useState, useCallback } from 'react';

export const useAdvancedFields = (advancedFields, searchParameters) => {
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  // If one of the advanced fields is filled in when landing on the screen,
  // show the advanced fields section
  const defaultFilterOpen = useCallback(() => {
    return Object.keys(searchParameters || {})
      .filter(key => searchParameters[key])
      .some(value => advancedFields.includes(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advancedFields]);

  useEffect(() => {
    setShowAdvancedFields(defaultFilterOpen());
  }, [defaultFilterOpen]);

  return { showAdvancedFields, setShowAdvancedFields };
};
