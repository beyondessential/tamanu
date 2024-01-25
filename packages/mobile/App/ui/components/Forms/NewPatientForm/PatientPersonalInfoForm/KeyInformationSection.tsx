import React, { ReactElement } from 'react';

import { useSettings } from '~/ui/contexts/SettingContext';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { Gender, GenderOptions } from '~/ui/helpers/constants';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';
import { TextField } from '../../../TextField/TextField';

export const KeyInformationSection = (): ReactElement => {
  const { getSetting } = useSettings();
  let filteredGenderOptions = GenderOptions;
  if (getSetting<boolean>('features.hideOtherSex') === true) {
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
        required={getSetting<boolean>('fields.email.requiredPatientData')}
      />
    </>
  );
};
