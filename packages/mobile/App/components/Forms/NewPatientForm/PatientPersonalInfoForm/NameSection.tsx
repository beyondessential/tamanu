import React, { ReactElement } from 'react';
import { TextField } from '/components/TextField/TextField';
import { FormGroup } from '../FormGroup';
import { FormSection } from './index';
import { Field } from '../../FormField';

export const NameSection = ({ scrollToField }: FormSection): ReactElement => (
  <FormGroup sectionName="NAME">
    <Field
      onFocus={scrollToField('firstName')}
      label="First Name"
      name="firstName"
      component={TextField}
    />
    <Field
      onFocus={scrollToField('middleName')}
      label="Middle Name"
      name="middleName"
      component={TextField}
    />
    <Field
      onFocus={scrollToField('lastName')}
      label="Last Name"
      name="lastName"
      component={TextField}
    />
  </FormGroup>
);
