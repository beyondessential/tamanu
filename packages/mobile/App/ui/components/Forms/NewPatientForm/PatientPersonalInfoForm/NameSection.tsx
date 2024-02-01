import React, { ReactElement } from 'react';
import { TextField } from '../../../TextField/TextField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { useSettings } from '~/ui/contexts/SettingContext';

export const NameSection = (): ReactElement => {
  const { getSetting } = useSettings();

  return (
    <>
      <LocalisedField name="firstName" component={TextField} required />
      <LocalisedField
        name="middleName"
        component={TextField}
        required={getSetting<boolean>('localisation.fields.middleName.requiredPatientData')}
      />
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField
        name="culturalName"
        component={TextField}
        required={getSetting<boolean>('localisation.fields.culturalName.requiredPatientData')}
      />
    </>
  );
};
