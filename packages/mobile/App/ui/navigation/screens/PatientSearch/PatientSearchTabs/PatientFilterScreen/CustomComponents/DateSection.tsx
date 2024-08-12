import React, { ReactElement } from 'react';
import { DateField } from '/components/DateField/DateField';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';

const labelFontSize = screenPercentageToDP(2, Orientation.Height);

export const DateSection = (): ReactElement => (
  <StyledView marginLeft={20} marginRight={20}>
    <LocalisedField
      label={
        <TranslatedText
          stringId="general.localisedField.dateOfBirth.label"
          fallback="Date of birth"
        />
      }
      localisationPath="fields.dateOfBirth"
      labelFontSize={labelFontSize}
      fieldFontSize={labelFontSize}
      component={DateField}
      max={new Date()}
      name="dateOfBirth"
    />
  </StyledView>
);
