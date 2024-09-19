import React, { ReactElement } from 'react';

import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { Gender, GenderOptions } from '~/ui/helpers/constants';
import { RadioButtonGroup } from '~/ui/components/RadioButtonGroup';
import { DateField } from '~/ui/components/DateField/DateField';
import { TextField } from '../../../TextField/TextField';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useSettings } from '~/ui/contexts/SettingsContext';

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
        label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
        options={filteredGenderOptions}
        component={RadioButtonGroup}
        required
      />
      <LocalisedField
        label={
          <TranslatedText
            stringId="general.localisedField.dateOfBirth.label"
            fallback="Date of birth"
          />
        }
        name="dateOfBirth"
        max={new Date()}
        component={DateField}
        required
      />
      <LocalisedField
        label={
          <TranslatedText stringId="general.localisedField.email.label" fallback="Email address" />
        }
        name="email"
        component={TextField}
        required={getSetting<boolean>('fields.email.requiredPatientData')}
      />
    </>
  );
};
