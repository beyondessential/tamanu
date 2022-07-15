import React, { ReactElement } from 'react';
// Components
import { Section } from './Section';
import { Field } from '/components/Forms/FormField';
import { DateField } from '/components/DateField/DateField';

export const DateSection = (): ReactElement => (
  <Section localisationPath="fields.dateOfBirth">
    <Field component={DateField} max={new Date()} name="dateOfBirth" />
  </Section>
);
