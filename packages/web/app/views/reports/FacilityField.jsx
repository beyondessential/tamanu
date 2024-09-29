import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { useFormikContext } from 'formik';
import { omit } from 'lodash';

export const FacilityField = ({ required, label, parametersFilteredByFacility }) => {
  const { setValues, values } = useFormikContext();
  const facilitySuggester = useSuggester('facility');

  const handleClearFacilityFilteredFields = () => {
    if (!parametersFilteredByFacility.length) {
      return;
    }
    setValues(omit(values, parametersFilteredByFacility));
  };
  return (
    <Field
      name="facilityId"
      label={label}
      component={AutocompleteField}
      onChange={handleClearFacilityFilteredFields}
      suggester={facilitySuggester}
      required={required}
    />
  );
};
