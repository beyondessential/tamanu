import React from 'react';

import { SelectField, Field } from '../../components';
import { useSettings } from '../../contexts/Settings';

export const ImagingTypeField = ({ name = 'imagingType', required }) => {
  const { getSetting } = useSettings();
  const imagingTypes = getSetting('imagingTypes') || {};
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
