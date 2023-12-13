import React, { ReactElement } from 'react';

import { DateField } from '~/ui/components/DateField/DateField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { Gender, GenderOptions } from '~/ui/helpers/constants';
import { TextField } from '../../../TextField/TextField';

export const KeyInformationSection = (): ReactElement => {
  const { getBool } = useLocalisation();
  let filteredGenderOptions = GenderOptions;
  if (getBool('features.hideOtherSex') === true) {
    filteredGenderOptions = filteredGenderOptions.filter(({ value }) => value !== Gender.Other);
  }
  return (
    <>
      <LocalisedField
        name="sex"
        options={filteredGenderOptions}
        component={RadioButtonGroup}
        required
      />
      <LocalisedField name="dateOfBirth" max={new Date()} component={DateField} required />
      <LocalisedField
        name="email"
        component={TextField}
        required={getBool('fields.email.requiredPatientData')}
      />
    </>
  );
};
