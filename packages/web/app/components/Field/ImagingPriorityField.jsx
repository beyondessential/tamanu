import React from 'react';

import { Field } from './Field';
import { BaseSelectField } from './SelectField';
import { useLocalisation } from '../../contexts/Localisation';
import { TranslatedText } from '../Translation/TranslatedText';
import { SelectField } from '../Translation/TranslatedSelectField.jsx';

export const ImagingPriorityField = ({ name = 'priority', required }) => {
  const { getLocalisation } = useLocalisation();
  const imagingPriorities = getLocalisation('imagingPriorities') || [];

  return (
    <Field
      name={name}
      label={<TranslatedText stringId="imaging.form.priority.label" fallback="Priority" />}
      component={SelectField}
      options={imagingPriorities}
      required={required}
      prefix="imaging.property.priority"
    />
  );
};
