import React from 'react';

import { Field } from './Field';
import { SelectField } from './SelectField';
import { TranslatedText } from '../Translation/TranslatedText';
import { useSettings } from '../../contexts/Settings';

export const ImagingPriorityField = ({ name = 'priority', required }) => {
  const { getSetting } = useSettings();
  const imagingPriorities = getSetting('imagingPriorities') || [];

  return (
    <Field
      name={name}
      label={
        <TranslatedText
          stringId="imaging.priority.label"
          fallback="Priority"
          data-testid="translatedtext-jq2i"
        />
      }
      component={SelectField}
      options={imagingPriorities}
      required={required}
      prefix="imaging.property.priority"
      data-testid="field-xemr"
    />
  );
};
