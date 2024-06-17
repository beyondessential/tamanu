import React from 'react';

import { Field } from '../../components';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { IMAGING_TYPES } from '@tamanu/constants';
import { TranslatedSelectField } from '../../components/Translation/TranslatedSelect';

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
      component={TranslatedSelectField}
      options={imagingTypeOptions}
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
      prefix="imaging.property.type"
    />
  );
};
