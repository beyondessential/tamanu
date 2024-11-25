import React, { ReactElement } from 'react';
// Components
import { RadioButtonGroup } from '/components/RadioButtonGroup';
// Helpers
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { FemaleGender, MaleGender } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const buttonWidth = screenPercentageToDP(26, Orientation.Width);

const options = [
  MaleGender,
  FemaleGender,
  {
    label: 'All',
    value: 'all',
  },
];

export const SexSection = (): ReactElement => (
  <StyledView marginLeft={20} marginRight={20} marginBottom={20}>
    <LocalisedField
      label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
      component={RadioButtonGroup}
      name="sex"
      options={options}
      labelFontSize={screenPercentageToDP(2, Orientation.Height)}
      optionComponentWidth={buttonWidth}
      initialValue="all"
    />
  </StyledView>
);
