import React, { ReactElement } from 'react';
import { TextField } from '../../../TextField/TextField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const NameSection = (): ReactElement => {
  const { getBool } = useLocalisation();

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
        required={getBool('fields.middleName.requiredPatientData')}
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
            fallback="Cultural name"
          />
        }
        component={TextField}
        required={getBool('fields.culturalName.requiredPatientData')}
      />
    </>
  );
};
