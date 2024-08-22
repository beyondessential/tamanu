import React, { ReactElement } from 'react';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { TextField } from '~/ui/components/TextField/TextField';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';

const fontSize = screenPercentageToDP(2, Orientation.Height)

export const NameSection = (): ReactElement => (
  <StyledView marginTop={30}>
    <StyledView marginLeft={20} marginRight={20}>
      <LocalisedField
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
        }
        placeholder={
          <TranslatedText
            stringId="general.localisedField.firstName.placeholder"
            fallback="First name"
          />
        }
        labelFontSize={fontSize}
        fieldFontSize={fontSize}
        component={TextField}
        name="firstName"
      />
    </StyledView>
    <StyledView marginLeft={20} marginRight={20}>
      <LocalisedField
        label={
          <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
        }
        placeholder={
          <TranslatedText
            stringId="general.localisedField.lastName.placeholder"
            fallback="Last name"
          />
        }
        labelFontSize={fontSize}
        fieldFontSize={fontSize}
        component={TextField}
        name="lastName"
      />
    </StyledView>
  </StyledView>
);
