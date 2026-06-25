import React, { ReactElement } from 'react';
// Components
import { RadioButtonGroup } from '/components/RadioButtonGroup';
// Helpers
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { FemaleGender, Gender, MaleGender, OtherGender } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useSettings } from '~/ui/contexts/SettingsContext';

const buttonWidth = screenPercentageToDP(26, Orientation.Width);

const baseOptions = [
  MaleGender,
  FemaleGender,
  OtherGender,
  {
    label: 'All',
    value: 'all',
  },
];

export const SexSection = (): ReactElement => {
  const { getSetting } = useSettings();
  const options =
    getSetting<boolean>('features.hideOtherSex') === true
      ? baseOptions.filter(({ value }) => value !== Gender.Other)
      : baseOptions;
  return (
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
};
