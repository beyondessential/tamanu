import React, { ReactElement } from 'react';
// Components
import { RadioButtonGroup } from '/components/RadioButtonGroup';
import { Section } from './Section';
import { SelectButton } from './SelectButton';
import { Field } from '/components/Forms/FormField';
// Helpers
import { MaleGender, FemaleGender } from '/helpers/constants';


const options = [
  {
    label: 'All',
    value: 'all',
  },
  MaleGender,
  FemaleGender,
];

export const SexSection = ():ReactElement => (
  <Section
    title="Sex"
  >
    <Field
      component={RadioButtonGroup}
      name="gender"
      options={options}
      CustomComponent={SelectButton}
    />
  </Section>
);
