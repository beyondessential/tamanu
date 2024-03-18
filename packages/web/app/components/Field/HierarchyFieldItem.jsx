import React, { useEffect, useMemo } from 'react';
import { useApi } from '../../api';
import { AutocompleteField } from './AutocompleteField';
import { LocalisedField } from './LocalisedField';
import { useFormikContext } from 'formik';
import { Suggester } from '../../utils/suggester';

const HierarchyFieldItem = ({ isFirstLevel, relationType, parentId, fieldData }) => {
  const api = useApi();
  const { setFieldValue } = useFormikContext();

  const suggester = useMemo(() => {
    return new Suggester(api, fieldData.referenceType, {
      enable: isFirstLevel || !!parentId,
      baseQueryParameters: !isFirstLevel && { parentId, relationType },
    });
  }, [parentId, relationType]);

  useEffect(() => {
    setFieldValue(fieldData.name, undefined);
  }, [parentId]);

  return (
    <LocalisedField
      component={AutocompleteField}
      suggester={suggester}
      disabled={!isFirstLevel && !parentId}
      {...fieldData}
    />
  );
};

export default HierarchyFieldItem;
