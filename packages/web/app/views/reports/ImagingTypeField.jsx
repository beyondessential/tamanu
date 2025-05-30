import React from 'react';

import { Field, SelectField } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const ImagingTypeField = ({ name = 'imagingType', label, required }) => {
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
        label ?? (
          <TranslatedText
            stringId="report.generate.parameter.imagingType.label"
            fallback="Imaging type"
            data-testid="translatedtext-6y0p"
          />
        )
      }
      required={required}
      component={SelectField}
      options={imagingTypeOptions}
      data-testid="field-d8hq"
    />
  );
};
