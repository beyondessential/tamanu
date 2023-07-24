import React, { ReactElement } from 'react';
import { TextField } from '../../../TextField/TextField';
import { FormGroup } from '../FormGroup';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';

export const NameSection = (): ReactElement => (
  <FormGroup sectionName="NAME">
    <LocalisedField name="firstName" component={TextField} required />
    <LocalisedField name="middleName" component={TextField} />
    <LocalisedField name="lastName" component={TextField} required />
    <LocalisedField name="culturalName" component={TextField} />
  </FormGroup>
);
