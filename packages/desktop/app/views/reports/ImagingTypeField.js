import React from 'react';

import { SelectField, Field } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../../components/Translation/TranslatedText';

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
      label={
        <TranslatedText stringId="report.parameter.imagingType.label" fallback="Imaging type" />
      }
      component={SelectField}
      options={imagingTypeOptions}
      required={required}
    />
  );
};
