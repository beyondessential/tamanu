import React, { ReactElement } from 'react';
// Components
import { Section } from './Section';
import { Field } from '/components/Forms/FormField';
import { Checkbox } from '/components/Checkbox';

export const OnlyShowOptions = (): ReactElement => (
  <Section title="Only show">
    <Field
      name="onlyShowText"
      component={Checkbox}
      text="Only show text text"
    />
  </Section>
);
