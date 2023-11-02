import React, { ReactElement } from 'react';
// Components
import { RadioButtonGroup } from '/components/RadioButtonGroup';
// Helpers
import { MaleGender, FemaleGender } from '/helpers/constants';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';

const options = [
  MaleGender,
  FemaleGender,
  {
    label: 'All',
    value: 'all',
  },
];

export const SexSection = (): ReactElement => (
         <StyledView marginLeft={20} marginRight={20}>
           <LocalisedField
             localisationPath="fields.sex"
             component={RadioButtonGroup}
             name="sex"
             options={options}
           />
         </StyledView>
       );
