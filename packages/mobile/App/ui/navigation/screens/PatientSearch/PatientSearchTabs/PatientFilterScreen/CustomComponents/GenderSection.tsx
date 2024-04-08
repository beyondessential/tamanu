import React, { ReactElement } from 'react';
// Components
import { RadioButtonGroup } from '/components/RadioButtonGroup';
// Helpers
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { FemaleGender, MaleGender } from '/helpers/constants';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';

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
      localisationPath="fields.sex"
      component={RadioButtonGroup}
      name="sex"
      options={options}
      labelFontSize={14}
      componentWidth={buttonWidth}
    />
  </StyledView>
);
