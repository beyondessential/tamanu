import React from 'react';

import { Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ButtonRow, ConfirmCancelRow } from '../components/ButtonRow';
import { Button } from '../components/Button';

import { PrimaryDetailsGroup, SecondaryDetailsGroup } from './NewPatientForm';

export const PatientDetailsForm = ({ patientSuggester, facilitySuggester, patient, onSubmit }) => {
  const render = React.useCallback(
    ({ submitForm }) => (
      <FormGrid>
        <PrimaryDetailsGroup />
        <SecondaryDetailsGroup
          patientSuggester={patientSuggester}
          facilitySuggester={facilitySuggester}
        />
        <ButtonRow>
          <Button variant="contained" color="primary" onClick={submitForm}>
            Save
          </Button>
        </ButtonRow>
      </FormGrid>
    ),
    [patientSuggester, facilitySuggester],
  );

  return <Form render={render} initialValues={patient} onSubmit={onSubmit} />;
};
