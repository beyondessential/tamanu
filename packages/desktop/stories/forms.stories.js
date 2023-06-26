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
} from 'shared/demoData';
import { VACCINE_RECORDING_TYPES } from 'shared/constants';

import { EncounterForm } from '../app/forms/EncounterForm';
import { TriageForm } from '../app/forms/TriageForm';
import { ProcedureForm } from '../app/forms/ProcedureForm';
import { AllergyForm } from '../app/forms/AllergyForm';
import { VaccineForm } from '../app/forms/VaccineForm';
import { OngoingConditionForm } from '../app/forms/OngoingConditionForm';
import { DischargeForm } from '../app/forms/DischargeForm';
import { NewPatientForm } from '../app/forms/NewPatientForm';
import { PatientDetailsForm } from '../app/forms/PatientDetailsForm';
import { LabRequestForm } from '../app/forms/LabRequestForm';
import { MedicationForm } from '../app/forms/MedicationForm';
import { DeathForm } from '../app/forms/DeathForm';
import { FamilyHistoryForm } from '../app/forms/FamilyHistoryForm';
import { createDummySuggester, mapToSuggestions } from './utils';
import { TestSelectorInput } from '../app/components/TestSelector';
import { Modal } from '../app/components/Modal';

import '@fortawesome/fontawesome-free/css/all.css';

const PATIENTS = new Array(20).fill(0).map(x => createDummyPatient());

const practitionerSuggester = createDummySuggester(mapToSuggestions(USERS));
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

const testCategories = [
  { label: 'Sweet', value: 'sweet' },
  { label: 'Savoury', value: 'savoury' },
];

const testTypes = [
  { name: 'Grape', id: 'grape', labTestCategoryId: 'sweet' },
  { name: 'Vanilla', id: 'vanilla', labTestCategoryId: 'sweet' },
  { name: 'Chocolate', id: 'chocolate', labTestCategoryId: 'sweet' },
  { name: 'Boysenberry', id: 'boysenberry', labTestCategoryId: 'sweet' },
  { name: 'Strawberry', id: 'strawb', labTestCategoryId: 'sweet' },
  { name: 'Lemon', id: 'lemon', labTestCategoryId: 'sweet' },
  { name: 'Pepper', id: 'pepper', labTestCategoryId: 'savoury' },
  { name: 'Cabbage', id: 'cabbage', labTestCategoryId: 'savoury' },
  { name: 'Sprout', id: 'sprout', labTestCategoryId: 'savoury' },
  { name: 'Yeast', id: 'yeast', labTestCategoryId: 'savoury' },
  { name: 'Zucchini', id: 'zuc', labTestCategoryId: 'savoury' },
  { name: 'Egg', id: 'egg', labTestCategoryId: 'savoury' },
  { name: 'Chicken', id: 'chicken', labTestCategoryId: 'savoury' },
  { name: 'Leek', id: 'leek', labTestCategoryId: 'savoury' },
  { name: 'Chilli', id: 'chilli', labTestCategoryId: 'savoury' },
  { name: 'Fennel', id: 'fennel', labTestCategoryId: 'savoury' },
];

const StorybookableTestSelector = () => {
  const [value, setValue] = React.useState([]);
  const changeAction = action('change');
  const onChange = React.useCallback(
    e => {
      const newValue = e.target.value;
      changeAction(newValue);
      setValue(newValue);
    },
    [setValue],
  );

  return <TestSelectorInput testTypes={testTypes} value={value} onChange={onChange} />;
};

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

storiesOf('Forms/LabRequestForm', module)
  .add('LabRequestForm', () => (
    <LabRequestForm
      onSubmit={action('submit')}
      onCancel={action('cancel')}
      visit={{
        visitType: 'admission',
        startDate: new Date(),
        examiner: {
          displayName: 'Dr Jim Taylor',
        },
      }}
      testTypes={testTypes}
      testCategories={testCategories}
      generateDisplayId={shortid.generate}
      practitionerSuggester={practitionerSuggester}
    />
  ))
  .add('TestSelector', () => <StorybookableTestSelector />);
