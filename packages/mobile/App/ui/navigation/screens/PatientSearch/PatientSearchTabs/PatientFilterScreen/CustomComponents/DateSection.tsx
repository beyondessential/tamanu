import React, { ReactElement } from 'react';
import { DateField } from '/components/DateField/DateField';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const DateSection = (): ReactElement => (
  <StyledView marginLeft={20} marginRight={20}>
    <LocalisedField
      label={
        <TranslatedText
          stringId="general.localisedField.dateOfBirth.label"
          fallback="Date of birth"
        />
      }
      labelFontSize={14}
      component={DateField}
      max={new Date()}
      name="dateOfBirth"
    />
  </StyledView>
);
