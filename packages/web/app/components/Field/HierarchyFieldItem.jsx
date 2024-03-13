import React, { useEffect } from 'react';
import { useApi, useSuggester } from '../../api';
import { AutocompleteField } from './AutocompleteField';
import { LocalisedField } from './LocalisedField';
import { useMemo } from 'react';
import { HierarchySuggester } from '../../utils/hierarchySuggester';
import { useFormikContext } from 'formik';

const HierarchyFieldItem = ({ isFirstLevel, relationType, parentId, fieldData }) => {
  const api = useApi();
  const { setFieldValue } = useFormikContext();

  const firstLevelSuggester = useSuggester(fieldData.referenceType);

  const otherLevelSuggester = useMemo(() => {
    return new HierarchySuggester(api, parentId, { baseQueryParameters: { relationType } });
  }, [parentId]);

  useEffect(() => {
    setFieldValue(fieldData.name, undefined);
  }, [parentId]);

  return (
    <LocalisedField
      component={AutocompleteField}
      suggester={isFirstLevel ? firstLevelSuggester : otherLevelSuggester}
      disabled={!isFirstLevel && !parentId}
      {...fieldData}
    />
  );
};

export default HierarchyFieldItem;
