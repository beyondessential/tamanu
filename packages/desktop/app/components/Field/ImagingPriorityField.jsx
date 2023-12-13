import React from 'react';

import { useLocalisation } from '../../contexts/Localisation';
import { Field } from './Field';
import { SelectField } from './SelectField';

export const ImagingPriorityField = ({ name = 'priority', required }) => {
  const { getLocalisation } = useLocalisation();
  const imagingPriorities = getLocalisation('imagingPriorities') || [];

  return (
    <Field
      name={name}
      label="Priority"
      component={SelectField}
      options={imagingPriorities}
      required={required}
    />
  );
};
