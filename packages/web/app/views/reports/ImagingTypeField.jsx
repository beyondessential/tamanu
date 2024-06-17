import React from 'react';

import { Field, SelectField } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const ImagingTypeField = ({ name = 'imagingType', required }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  const imagingTypeOptions = Object.entries(imagingTypes).map(([key, val]) => ({
    label: val.label,
    value: key,
  }));

  // enumRegistry todo: this actully could work - using the ImagingType enum from @tamanu/constants
  // Then filter and map labels based on config
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
