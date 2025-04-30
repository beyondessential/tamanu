import React from 'react';
import shortid from 'shortid';
import { action } from '@storybook/addon-actions';

import {
  createDummyPatient,
  DEPARTMENTS,
  DIAGNOSES,
  DISPOSITIONS,
  DRUGS,
  FACILITIES,
  LOCATIONS,
  USERS,
} from '@tamanu/database/demoData';
import { VACCINE_RECORDING_TYPES } from '@tamanu/constants';
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
import { Modal, Form } from '../../app/components';

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
const diagnosisSuggester = createDummySuggester(mapToSuggestions(DIAGNOSES));
const patientSuggester = createDummySuggester(
  PATIENTS.map(({ firstName, lastName, id }) => ({
    label: `${firstName} ${lastName}`,
    value: id,
  })),
);
const drugSuggester = createDummySuggester(mapToSuggestions(DRUGS));

export default {
  title: 'Forms',
  component: Form,
};

export const DeathFormStory = () => {
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
        diagnosisSuggester={diagnosisSuggester}
        facilitySuggester={facilitySuggester}
      />
    </Modal>
  );
};

const getScheduledVaccines = () => {
  return [];
};

export const VaccineFormStory = () => (
  <Modal title="Record vaccine" open>
    <VaccineForm
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      practitionerSuggester={practitionerSuggester}
      getScheduledVaccines={getScheduledVaccines}
      vaccineRecordingType={VACCINE_RECORDING_TYPES.GIVEN}
    />
  </Modal>
);

export const LoginFormBroken = () => (
  <div>Login view unstorybookable until ServerDetectingField can be separated out</div>
);

export const VisitFormDefault = () => (
  <EncounterForm
    onSubmit={action('submit')}
    locationSuggester={locationSuggester}
    practitionerSuggester={practitionerSuggester}
  />
);

export const VisitFormEditing = () => (
  <EncounterForm
    onSubmit={action('submit')}
    locationSuggester={locationSuggester}
    practitionerSuggester={practitionerSuggester}
  />
);

export const TriageFormStory = () => (
  <TriageForm
    onSubmit={action('submit')}
    locationSuggester={locationSuggester}
    practitionerSuggester={practitionerSuggester}
  />
);

export const ProcedureFormStory = () => (
  <ProcedureForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    locationSuggester={locationSuggester}
    practitionerSuggester={practitionerSuggester}
    procedureSuggester={createDummySuggester(['CPT 1', 'CPT 2', 'CPT 3', 'CPT 4'])}
    anesthesiaSuggester={createDummySuggester(['Anesthesia 1', 'Anesthesia 2', 'Anesthesia 3'])}
  />
);

export const AllergyFormStory = () => (
  <AllergyForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
  />
);

export const OngoingConditionFormStory = () => (
  <OngoingConditionForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
  />
);

export const DischargeFormStory = () => (
  <DischargeForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
    dispositionSuggester={dispositionSuggester}
  />
);

export const NewPatientFormStory = () => (
  <NewPatientForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    generateDisplayId={shortid.generate}
    facilitySuggester={facilitySuggester}
    patientSuggester={patientSuggester}
  />
);

export const PatientDetailsFormStory = () => (
  <PatientDetailsForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    generateDisplayId={shortid.generate}
    facilitySuggester={facilitySuggester}
    patientSuggester={patientSuggester}
  />
);

export const FamilyHistoryFormStory = () => (
  <FamilyHistoryForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
    diagnosisSuggester={diagnosisSuggester}
  />
);

export const MedicationFormStory = () => (
  <MedicationForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
    drugSuggester={drugSuggester}
  />
);

export const LabRequestFormStory = () => (
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
);

export const LabRequestSummaryPaneStory = () => (
  <MockedApi endpoints={mockLabRequestFormEndpoints}>
    <Modal width="md" title="New lab request" open>
      <LabRequestSummaryPane encounter={{}} labRequests={[fakeLabRequest(), fakeLabRequest()]} />
    </Modal>
  </MockedApi>
);
