import React from 'react';

import { SelectField, Field } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';

export const ImagingTypeField = ({ name = 'imagingType', required }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingTypeOptions = Object.entries(imagingTypes).map(([key, val]) => ({
    label: val.label,
    value: key,
  }));

  return (
    <Field
      name={name}
      label="Imaging type"
      component={SelectField}
      options={imagingTypeOptions}
      required={required}
    />
  );
};
