import React, { ReactElement } from 'react';
// Components
import { Section } from './Section';
import { Field } from '../../../../../../components/Forms/FormField';
import { DateField } from '../../../../../../components/DateField/DateField';


export const DateSection = (): ReactElement => (
  <Section title="Date of Birth">
    <Field
      component={DateField}
      name="dateOfBirth"
    />
  </Section>
);
