import React, { ReactElement } from 'react';
// Components
import { DateField } from '/components/DateField/DateField';
import { Field } from '/components/Forms/FormField';
import { Section } from './Section';

export const DateSection = (): ReactElement => (
  <Section localisationPath="fields.dateOfBirth">
    <Field component={DateField} max={new Date()} name="dateOfBirth" />
  </Section>
);
