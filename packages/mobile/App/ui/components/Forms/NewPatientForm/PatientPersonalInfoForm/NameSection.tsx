import React, { ReactElement } from 'react';
import { TextField } from '../../../TextField/TextField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';

export const NameSection = (): ReactElement => {
  const { getBool } = useLocalisation();

  return (
    <>
      <LocalisedField name="firstName" component={TextField} required />
      <LocalisedField
        name="middleName"
        component={TextField}
        required={getBool('fields.middleName.requiredPatientData')}
      />
      <LocalisedField name="lastName" component={TextField} required />
      <LocalisedField
        name="culturalName"
        component={TextField}
        required={getBool('fields.culturalName.requiredPatientData')}
      />
    </>
  );
};
