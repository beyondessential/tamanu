import React, { ReactElement } from 'react';
//Components
import { Section } from './Section';
import { StyledView } from '/styled/common';
import { Field } from '/components/Forms/FormField';
import { TextField } from '/components/TextField/TextField';
// Helpers
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const NameSection = (): ReactElement => (
  <Section title="Name">
    <StyledView
      height={screenPercentageToDP(15.01, Orientation.Height)}
      justifyContent="space-between"
    >
      <Field label="First Name" component={TextField} name="firstName" />
      <Field label="Last Name" component={TextField} name="lastName" />
    </StyledView>
  </Section>
);
