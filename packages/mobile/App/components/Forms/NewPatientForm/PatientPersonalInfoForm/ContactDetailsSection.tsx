import React, { ReactElement } from 'react';
import { FormSection } from './index';
import { FormGroup } from '../FormGroup';
import { Field } from '../../FormField';
import { TextField } from '/components/TextField/TextField';

export const ContactDetailsSection = ({
  scrollToField,
}: FormSection): ReactElement => (
  <FormGroup sectionName="CONTACT DETAILS" marginTop>
    <Field
      onFocus={scrollToField('email')}
      label="Email"
      name="email"
      component={TextField}
    />
    <Field
      onFocus={scrollToField('phone')}
      label="Phone"
      name="phone"
      component={TextField}
    />
  </FormGroup>
);
