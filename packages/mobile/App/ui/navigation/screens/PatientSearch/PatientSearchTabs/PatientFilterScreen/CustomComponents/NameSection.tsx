import React, { ReactElement } from 'react';

//Components
import { Section } from './Section';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { TextField } from '~/ui/components/TextField/TextField';
// Helpers
import { screenPercentageToDP, Orientation } from '/helpers/screen';

export const NameSection = (): ReactElement => (
  <Section title="Name">
    <StyledView
      height={screenPercentageToDP(15.01, Orientation.Height)}
      justifyContent="space-between"
    >
      <LocalisedField component={TextField} name="firstName" />
      <LocalisedField component={TextField} name="lastName" />
    </StyledView>
  </Section>
);
