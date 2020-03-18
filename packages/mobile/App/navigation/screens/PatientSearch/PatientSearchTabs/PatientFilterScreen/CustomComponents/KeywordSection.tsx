import React, { ReactElement } from 'react';
// Components
import { Section } from './Section';
import { Field } from '/components/Forms/FormField';
import { TextField } from '/components/TextField/TextField';


export const KeywordSection = (): ReactElement => (
  <Section
    title="Keywords"
  >
    <Field
      component={TextField}
      placeholder="Eg: Blood Type, Location, health ID, etc..."
      name="keywords"
    />
  </Section>
);
