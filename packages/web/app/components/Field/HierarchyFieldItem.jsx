import React, { useEffect } from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField } from './AutocompleteField';
import { LocalisedField } from './LocalisedField';
import { useFormikContext } from 'formik';

export const HierarchyFieldItem = ({ isFirstLevel, relationType, parentId, fieldData }) => {
  const { setFieldValue, dirty } = useFormikContext();

  const suggester = useSuggester(fieldData.referenceType, {
    enable: isFirstLevel || !!parentId,
    baseQueryParameters: !isFirstLevel && { parentId, relationType },
  });

  // Clear the value of the field when the parent field changes
  useEffect(() => {
    // Don't clear the value unless the form has been edited
    if (!dirty) return;
    setFieldValue(fieldData.name, undefined);
  }, [fieldData.name, parentId, setFieldValue, dirty]);

  return (
    <LocalisedField
      component={AutocompleteField}
      suggester={suggester}
      disabled={!isFirstLevel && !parentId}
      {...fieldData}
    />
  );
};
