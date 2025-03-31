import React, { useMemo } from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { useFormikContext } from 'formik';
import { omit } from 'lodash';
import { FIELD_TYPES_SUPPORTING_FILTER_BY_SELECTED_FACILITY } from './ParameterField';

export const FacilityField = ({
  required,
  label,
  filterBySelectedFacility,
  parameters,
  name = 'facilityId',
}) => {
  const { setValues, values } = useFormikContext();
  const facilitySuggester = useSuggester('facility');
  const fieldsToClear = useMemo(
    () =>
      parameters
        .filter(param =>
          FIELD_TYPES_SUPPORTING_FILTER_BY_SELECTED_FACILITY.includes(param.parameterField),
        )
        .map(({ name }) => name),
    [parameters],
  );

  const handleClearAssociatedFields = () => {
    if (!fieldsToClear.length || !filterBySelectedFacility) return;
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
      data-test-id='field-2c4d' />
  );
};
