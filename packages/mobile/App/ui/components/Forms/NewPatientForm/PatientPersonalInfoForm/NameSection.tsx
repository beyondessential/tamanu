import React, { ReactElement } from 'react';
import { TextField } from '../../../TextField/TextField';
import { FormGroup } from '../FormGroup';
import { Field } from '../../FormField';

export const NameSection = (): ReactElement => (
  <FormGroup sectionName="NAME">
    <Field
      label="First Name"
      name="firstName"
      component={TextField}
    />
    <Field
      label="Middle Name"
      name="middleName"
      component={TextField}
    />
    <Field
      label="Last Name"
      name="lastName"
      component={TextField}
    />
    <Field
      label="Cultural Name"
      name="culturalName"
      component={TextField}
    />
  </FormGroup>
);
