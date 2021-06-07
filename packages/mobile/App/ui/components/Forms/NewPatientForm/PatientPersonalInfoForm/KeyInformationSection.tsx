import React, { ReactElement } from 'react';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { FormGroup } from '~/ui/components/Forms/NewPatientForm/FormGroup';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { GenderOptions, Gender } from '~/ui/helpers/constants';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';

export const KeyInformationSection = (): ReactElement => {
  const { getBool } = useLocalisation()
  let filteredGenderOptions = GenderOptions;
  if (getBool('features.hideOtherSex') === true) {
    filteredGenderOptions = filteredGenderOptions.filter(({ value }) => value !== Gender.Other);
  }
  return (
    <FormGroup sectionName="KEY INFORMATION" marginTop>
      <LocalisedField name="sex" options={filteredGenderOptions} component={RadioButtonGroup} />
      <LocalisedField name="dateOfBirth" component={DateField} />
    </FormGroup>
  );
}
