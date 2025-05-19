import React from 'react';

import { Field, LocalisedLocationField } from '../../components';

export const LocationField = ({ name = 'locationId', label, required }) => (
  <Field
    name={name}
    label={label}
    component={LocalisedLocationField}
    required={required}
    enableLocationStatus={false}
  />
);
