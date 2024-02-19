import React from 'react';

import { Field } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';
import { SelectField } from '../../components/Translation/TranslatedSelectField.jsx';
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
        <TranslatedText
          stringId="report.generate.parameter.imagingType.label"
          fallback="Imaging type"
        />
      }
      component={SelectField}
      options={imagingTypeOptions}
      required={required}
      prefix="imaging.property.type"
    />
  );
};
