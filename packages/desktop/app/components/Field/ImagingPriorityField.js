import React from 'react';

import { Field } from './Field';
import { SelectField } from './SelectField';
import { useConfig } from '../../contexts/Localisation';

export const ImagingPriorityField = ({ name = 'priority', required }) => {
  const imagingPriorities = useConfig('imagingPriorities') || [];

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
