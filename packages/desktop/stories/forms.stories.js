import React from 'react';

import shortid from 'shortid';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import {
  createDummyVisit,
  createDummyPatient,
  DIAGNOSES,
  DISPOSITIONS,
  DRUGS,
  FACILITIES,
  LOCATIONS,
  USERS,
  DEPARTMENTS,
} from 'shared/demoData';

import { Box } from '@material-ui/core';
import styled from 'styled-components';
import { MockedApi } from './utils/mockedApi';
import { EncounterForm } from '../app/forms/EncounterForm';
import { TriageForm } from '../app/forms/TriageForm';
import { ProcedureForm } from '../app/forms/ProcedureForm';
import { AllergyForm } from '../app/forms/AllergyForm';
import { ImmunisationForm } from '../app/forms/ImmunisationForm';
import { OngoingConditionForm } from '../app/forms/OngoingConditionForm';
import { DischargeForm } from '../app/forms/DischargeForm';
import { NewPatientForm } from '../app/forms/NewPatientForm';
import { PatientDetailsForm } from '../app/forms/PatientDetailsForm';
import { LabRequestForm } from '../app/forms/LabRequestForm';
import { MedicationForm } from '../app/forms/MedicationForm';
import { DeathForm } from '../app/forms/DeathForm';
import { FamilyHistoryForm } from '../app/forms/FamilyHistoryForm';
import { createDummySuggester, mapToSuggestions } from './utils';
import { Modal } from '../app/components/Modal';

import '@fortawesome/fontawesome-free/css/all.css';
import { mockLabTestTypes, mockTestSelectorEndpoints } from './testSelector.stories';

const PATIENTS = new Array(20).fill(0).map(() => createDummyPatient());

const departmentSuggester = createDummySuggester(mapToSuggestions(DEPARTMENTS));
const practitionerSuggester = createDummySuggester([
  ...mapToSuggestions(USERS),
  { label: 'Storybook test user', value: 'test-user-id' },
]);
const locationSuggester = createDummySuggester(mapToSuggestions(LOCATIONS));
const dispositionSuggester = createDummySuggester(mapToSuggestions(DISPOSITIONS));
const facilitySuggester = createDummySuggester(mapToSuggestions(FACILITIES));
const icd10Suggester = createDummySuggester(mapToSuggestions(DIAGNOSES));
const patientSuggester = createDummySuggester(
  PATIENTS.map(({ firstName, lastName, id }) => ({
    label: `${firstName} ${lastName}`,
    value: id,
  })),
);
const drugSuggester = createDummySuggester(mapToSuggestions(DRUGS));

storiesOf('Forms', module).add('DeathForm', () => {
  const onSubmit = data => {
    console.log('submit...', data);
  };

  const onCancel = () => {
    console.log('cancel...');
  };

  return (
    <Modal title="Record patient death" open>
      <DeathForm
        onCancel={onCancel}
        onSubmit={onSubmit}
        patient={PATIENTS[0]}
        practitionerSuggester={practitionerSuggester}
        icd10Suggester={icd10Suggester}
        facilitySuggester={facilitySuggester}
      />
    </Modal>
  );
});

const getScheduledVaccines = () => {
  return [];
};

storiesOf('Forms', module).add('ImmunisationForm', () => (
  <Modal title="Give vaccine" open>
    <ImmunisationForm
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      practitionerSuggester={practitionerSuggester}
      icd10Suggester={icd10Suggester}
      vaccineSuggester={icd10Suggester}
      departmentSuggester={icd10Suggester}
      getScheduledVaccines={getScheduledVaccines}
      locationSuggester={locationSuggester}
    />
  </Modal>
));

storiesOf('Forms/LoginForm', module).add('broken', () => (
  <div>Login view unstorybookable until ServerDetectingField can be separated out</div>
));
/*
  .add('default', () => <LoginView login={action('login')} />)
  .add('expired', () => (
    <LoginView
      login={action('login')}
      errorMessage="Your session has expired. Please log in again."
    />
  ));
  */

storiesOf('Forms/VisitForm', module)
  .add('Default', () => (
    <EncounterForm
      onSubmit={action('submit')}
      locationSuggester={locationSuggester}
      practitionerSuggester={practitionerSuggester}
    />
  ))
  .add('Editing', () => (
    <EncounterForm
      onSubmit={action('submit')}
      locationSuggester={locationSuggester}
      practitionerSuggester={practitionerSuggester}
      editedObject={createDummyVisit()}
    />
  ));

storiesOf('Forms', module).add('TriageForm', () => (
  <TriageForm
    onSubmit={action('submit')}
    locationSuggester={locationSuggester}
    practitionerSuggester={practitionerSuggester}
  />
));

storiesOf('Forms', module).add('ProcedureForm', () => (
  <ProcedureForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    locationSuggester={locationSuggester}
    practitionerSuggester={practitionerSuggester}
    procedureSuggester={createDummySuggester(['CPT 1', 'CPT 2', 'CPT 3', 'CPT 4'])}
    anesthesiaSuggester={createDummySuggester(['Anesthesia 1', 'Anesthesia 2', 'Anesthesia 3'])}
  />
));

storiesOf('Forms', module).add('AllergyForm', () => (
  <AllergyForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
  />
));

storiesOf('Forms', module).add('OngoingConditionForm', () => (
  <OngoingConditionForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
  />
));

storiesOf('Forms', module).add('DischargeForm', () => (
  <DischargeForm
    visit={createDummyVisit()}
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
    dispositionSuggester={dispositionSuggester}
  />
));

storiesOf('Forms', module).add('NewPatientForm', () => (
  <NewPatientForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    generateDisplayId={shortid.generate}
    facilitySuggester={facilitySuggester}
    patientSuggester={patientSuggester}
  />
));

storiesOf('Forms', module).add('PatientDetailsForm', () => (
  <PatientDetailsForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    generateDisplayId={shortid.generate}
    facilitySuggester={facilitySuggester}
    patientSuggester={patientSuggester}
  />
));

storiesOf('Forms', module).add('FamilyHistoryForm', () => (
  <FamilyHistoryForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
    icd10Suggester={icd10Suggester}
  />
));

storiesOf('Forms', module).add('MedicationForm', () => (
  <MedicationForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
    drugSuggester={drugSuggester}
  />
));

const labRequestEndpoints = {
  'suggestions/labSampleSite/all': () => [
    { id: '1', name: 'Arm' },
    { id: '2', name: 'Leg' },
    { id: '3', name: 'Shoulder' },
  ],
  'suggestions/labTestPriority/all': () => [
    { id: '1', name: 'Normal' },
    { id: '2', name: 'Urgent' },
  ],
  labTestType: () => mockLabTestTypes,
  ...mockTestSelectorEndpoints,
};

const StyledBox = styled(Box)`
  background-color: white;
  padding: 20px;
  box-shadow: 2px 2px 25px rgb(0 0 0 / 10%);
  border-radius: 5px;
  width: 800px;
`;

storiesOf('Forms/LabRequestForm', module).add('LabRequestForm', () => (
  <MockedApi endpoints={labRequestEndpoints}>
    <StyledBox width={800}>
      <LabRequestForm
        onNext={action('next')}
        onSubmit={action('submit')}
        onCancel={action('cancel')}
        generateDisplayId={shortid.generate}
        practitionerSuggester={practitionerSuggester}
        departmentSuggester={departmentSuggester}
      />
    </StyledBox>
  </MockedApi>
));
