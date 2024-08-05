import React from 'react';

import { Field, TranslatedSelectField } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { IMAGING_TYPES } from '@tamanu/constants';

export const ImagingTypeField = ({ name = 'imagingType', label, required }) => {
  const { getLocalisation } = useLocalisation();
  const imagingTypes = getLocalisation('imagingTypes') || {};
  return (
    <Field
      name={name}
      label={
        label ?? (
          <TranslatedText
            stringId="report.generate.parameter.imagingType.label"
            fallback="Imaging type"
          />
        )
      }
      component={TranslatedSelectField}
      required={required}
      transformOptions={options =>
        options.filter(option =>
          Object.keys(imagingTypes)
            .includes(option.value)
            .map(option => ({
              ...option,
              label: imagingTypes[option.value].label,
            })),
        )
      }
      enumValues={IMAGING_TYPES}
    />
  );
};
