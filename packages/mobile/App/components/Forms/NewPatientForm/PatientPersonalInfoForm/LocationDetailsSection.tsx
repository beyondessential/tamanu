import React, { ReactElement } from 'react';
import { FormSection } from './index';
import { FormGroup } from '../FormGroup';
import { Field } from '../../FormField';
import { TextField } from '/components/TextField/TextField';

export const LocationDetailsSection = ({
  scrollToField,
}: FormSection): ReactElement => (
  <FormGroup sectionName="LOCATION DETAILS" marginTop>
    <Field
      onFocus={scrollToField('province')}
      label="Province"
      name="province"
      component={TextField}
    />
    <Field
      onFocus={scrollToField('city')}
      label="Town/City"
      name="city"
      component={TextField}
    />
    <Field
      onFocus={scrollToField('address')}
      label="Address"
      name="address"
      component={TextField}
    />
  </FormGroup>
);
