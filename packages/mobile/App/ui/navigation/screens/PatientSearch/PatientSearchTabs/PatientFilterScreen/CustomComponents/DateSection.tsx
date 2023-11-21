import React, { ReactElement } from 'react';
import { DateField } from '/components/DateField/DateField';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';

export const DateSection = (): ReactElement => (
  <StyledView marginLeft={20} marginRight={20}>
    <LocalisedField
      localisationPath="fields.dateOfBirth"
      labelFontSize={14}
      component={DateField}
      max={new Date()}
      name="dateOfBirth"
    />
  </StyledView>
);
