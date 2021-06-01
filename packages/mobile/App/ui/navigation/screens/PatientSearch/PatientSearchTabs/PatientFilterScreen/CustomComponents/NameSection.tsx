import React, { ReactElement } from 'react';

//Components
import { Section } from './Section';
import { StyledView } from '/styled/common';
import { LocalisedField } from '/components/Forms/LocalisedField';
import { TextField } from '/components/TextField/TextField';
// Helpers
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const NameSection = (): ReactElement => (
  <Section title="Name">
    <StyledView
      height={screenPercentageToDP(15.01, Orientation.Height)}
      justifyContent="space-between"
    >
      <LocalisedField defaultLabel="First name" component={TextField} name="firstName" />
      <LocalisedField defaultLabel="Last name" component={TextField} name="lastName" />
    </StyledView>
  </Section>
);
