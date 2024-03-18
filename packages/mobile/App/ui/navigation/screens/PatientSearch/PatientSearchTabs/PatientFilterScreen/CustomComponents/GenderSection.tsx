import React, { ReactElement } from 'react';
// Components
import { RadioButtonGroup } from '/components/RadioButtonGroup';
// Helpers
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { FemaleGender, MaleGender } from '/helpers/constants';

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
    />
  </StyledView>
);
