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
} from '@tamanu/shared/demoData';
import { VACCINE_RECORDING_TYPES } from '@tamanu/shared/constants';
import { MockedApi } from '../utils/mockedApi';
import { mockLabRequestFormEndpoints } from '../utils/mockLabData';
import { EncounterForm } from '../../app/forms/EncounterForm';
import { TriageForm } from '../../app/forms/TriageForm';
import { ProcedureForm } from '../../app/forms/ProcedureForm';
import { AllergyForm } from '../../app/forms/AllergyForm';
import { VaccineForm } from '../../app/forms/VaccineForm';
import { OngoingConditionForm } from '../../app/forms/OngoingConditionForm';
import { DischargeForm } from '../../app/forms/DischargeForm';
import { NewPatientForm } from '../../app/forms/NewPatientForm';
import { PatientDetailsForm } from '../../app/forms/PatientDetailsForm';
import { LabRequestMultiStepForm } from '../../app/forms/LabRequestForm/LabRequestMultiStepForm';
import { MedicationForm } from '../../app/forms/MedicationForm';
import { DeathForm } from '../../app/forms/DeathForm';
import { FamilyHistoryForm } from '../../app/forms/FamilyHistoryForm';
import { LabRequestSummaryPane } from '../../app/views/patients/components/LabRequestSummaryPane';
import { createDummySuggester, mapToSuggestions } from '../utils';
import { Modal } from '../../app/components/Modal';

import '@fortawesome/fontawesome-free/css/all.css';
import { fakeLabRequest } from '../../.storybook/__mocks__/defaultEndpoints';

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

storiesOf('Forms', module).add('VaccineForm', () => (
  <Modal title="Record vaccine" open>
    <VaccineForm
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      practitionerSuggester={practitionerSuggester}
      getScheduledVaccines={getScheduledVaccines}
      vaccineRecordingType={VACCINE_RECORDING_TYPES.GIVEN}
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

storiesOf('Forms', module)
  .add('LabRequestForm', () => (
    <MockedApi endpoints={mockLabRequestFormEndpoints}>
      <Modal width="md" title="New lab request" open>
        <LabRequestMultiStepForm
          onNext={action('next')}
          onSubmit={action('submit')}
          onCancel={action('cancel')}
          generateDisplayId={shortid.generate}
          practitionerSuggester={practitionerSuggester}
          departmentSuggester={departmentSuggester}
        />
      </Modal>
    </MockedApi>
  ))
  .add('LabRequestSummaryPane', () => (
    <MockedApi endpoints={mockLabRequestFormEndpoints}>
      <Modal width="md" title="New lab request" open>
        <LabRequestSummaryPane
          encounter={{}}
          labRequests={[fakeLabRequest(), fakeLabRequest()]}
        />
      </Modal>
    </MockedApi>
  ));
