import React, { ReactElement } from 'react';
import { TextField } from '../../../TextField/TextField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';

export const NameSection = (): ReactElement => (
  <>
    <LocalisedField name="firstName" component={TextField} required />
    <LocalisedField name="middleName" component={TextField} />
    <LocalisedField name="lastName" component={TextField} required />
    <LocalisedField name="culturalName" component={TextField} />
  </>
);
