import React, { ReactElement } from 'react';
// Components
import { Field } from '/components/Forms/FormField';
import { RadioButtonGroup } from '/components/RadioButtonGroup';
import { Section } from './Section';
import { SelectButton } from './SelectButton';
// Helpers
import { FemaleGender, MaleGender } from '/helpers/constants';

const options = [
  {
    label: 'All',
    value: 'all',
  },
  MaleGender,
  FemaleGender,
];

export const SexSection = (): ReactElement => (
  <Section localisationPath="fields.sex">
    <Field
      component={RadioButtonGroup}
      name="sex"
      options={options}
      CustomComponent={SelectButton}
    />
  </Section>
);
