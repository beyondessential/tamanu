import React from 'react';

import { Field, SelectField } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedSelectField } from '../../components/Translation/TranslatedSelectField.jsx';

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
      component={TranslatedSelectField}
      options={imagingTypeOptions}
      required={required}
      prefix="imaging.property.type"
    />
  );
};
