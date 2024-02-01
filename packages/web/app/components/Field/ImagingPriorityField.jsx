import React from 'react';

import { Field } from './Field';
import { SelectField } from './SelectField';
import { useSettings } from '../../contexts/Settings';

export const ImagingPriorityField = ({ name = 'priority', required }) => {
  const { getSetting } = useSettings();
  const imagingPriorities = getSetting('localisation.imagingPriorities') || [];

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
