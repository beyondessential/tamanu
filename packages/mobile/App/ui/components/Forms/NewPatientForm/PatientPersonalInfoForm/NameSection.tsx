import React, { ReactElement } from 'react';
import { TextField } from '../../../TextField/TextField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useSettings } from '~/ui/contexts/SettingsContext';

export const NameSection = (): ReactElement => {
  const { getSetting } = useSettings();

  return (
    <>
      <LocalisedField
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
        }
        name="firstName"
        component={TextField}
        required
      />
      <LocalisedField
        name="middleName"
        label={
          <TranslatedText
            stringId="general.localisedField.middleName.label"
            fallback="Middle name"
          />
        }
        component={TextField}
        required={getSetting<boolean>('fields.middleName.requiredPatientData')}
      />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
        }
        component={TextField}
        required
      />
      <LocalisedField
        name="culturalName"
        label={
          <TranslatedText
            stringId="general.localisedField.culturalName.label"
            fallback="Cultural/traditional name"
          />
        }
        component={TextField}
        required={getSetting<boolean>('fields.culturalName.requiredPatientData')}
      />
    </>
  );
};
