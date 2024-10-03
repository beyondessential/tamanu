import React, { useMemo } from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { useFormikContext } from 'formik';
import { omit } from 'lodash';

export const FacilityField = ({ required, label, parameters, name = 'facilityId' }) => {
  const { setValues, values } = useFormikContext();
  const facilitySuggester = useSuggester('facility');
  const fieldsToClear = useMemo(
    () => parameters.filter(param => param.filterBySelectedFacility).map(param => param.name),
    [parameters],
  );

  const handleClearAssociatedFields = () => {
    if (!fieldsToClear.length) return;
    // Clear any set values that might be effected by dynamic facility filtering
    setValues(omit(values, fieldsToClear));
  };

  return (
    <Field
      name={name}
      label={label}
      component={AutocompleteField}
      onChange={handleClearAssociatedFields}
      suggester={facilitySuggester}
      required={required}
    />
  );
};
