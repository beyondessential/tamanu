import React from 'react';

import shortid from 'shortid';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import {
  createDummyVisit,
  DIAGNOSES,
  DRUGS,
  FACILITIES,
  LOCATIONS,
  PATIENTS,
  USERS,
} from 'Shared/demoData';
import { LoginView } from '../app/views/LoginView';
import { VisitForm } from '../app/forms/VisitForm';
import { TriageForm } from '../app/forms/TriageForm';
import { VitalsForm } from '../app/forms/VitalsForm';
import { ProcedureForm } from '../app/forms/ProcedureForm';
import { AllergyForm } from '../app/forms/AllergyForm';
import { AppointmentForm } from '../app/forms/AppointmentForm';
import { OngoingConditionForm } from '../app/forms/OngoingConditionForm';
import { DischargeForm } from '../app/forms/DischargeForm';
import { NewPatientForm } from '../app/forms/NewPatientForm';
import { PatientDetailsForm } from '../app/forms/PatientDetailsForm';
import { LabRequestForm } from '../app/forms/LabRequestForm';
import { ReferralForm } from '../app/forms/ReferralForm';
import { MedicationForm } from '../app/forms/MedicationForm';
import { FamilyHistoryForm } from '../app/forms/FamilyHistoryForm';
import { DeathForm } from '../app/forms/DeathForm';
import { NoteForm } from '../app/forms/NoteForm';

import { createDummySuggester, mapToSuggestions } from './utils';
import { TestSelectorInput } from '../app/components/TestSelector';

const practitionerSuggester = createDummySuggester(mapToSuggestions(USERS));
const locationSuggester = createDummySuggester(mapToSuggestions(LOCATIONS));
const facilitySuggester = createDummySuggester(mapToSuggestions(FACILITIES));
const icd10Suggester = createDummySuggester(mapToSuggestions(DIAGNOSES));
const patientSuggester = createDummySuggester(
  PATIENTS.map(({ firstName, lastName, _id }) => ({
    label: `${firstName} ${lastName}`,
    value: _id,
  })),
);
const drugSuggester = createDummySuggester(mapToSuggestions(DRUGS));

storiesOf('Forms/LoginForm', module)
  .add('default', () => <LoginView login={action('login')} />)
  .add('expired', () => (
    <LoginView
      login={action('login')}
      errorMessage="Your session has expired. Please log in again."
    />
  ));

storiesOf('Forms/VisitForm', module)
  .add('Default', () => (
    <VisitForm
      onSubmit={action('submit')}
      locationSuggester={locationSuggester}
      practitionerSuggester={practitionerSuggester}
    />
  ))
  .add('Editing', () => (
    <VisitForm
      onSubmit={action('submit')}
      locationSuggester={locationSuggester}
      practitionerSuggester={practitionerSuggester}
      editedObject={createDummyVisit()}
    />
  ));

storiesOf('Forms', module).add('NoteForm', () => (
  <NoteForm onSubmit={action('submit')} practitionerSuggester={practitionerSuggester} />
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

storiesOf('Forms', module).add('AppointmentForm', () => (
  <AppointmentForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    facilitySuggester={facilitySuggester}
    locationSuggester={locationSuggester}
    practitionerSuggester={practitionerSuggester}
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
  />
));

storiesOf('Forms', module).add('VitalsForm', () => (
  <VitalsForm onSubmit={action('submit')} onCancel={action('cancel')} />
));

storiesOf('Forms', module).add('NewPatientForm', () => (
  <NewPatientForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    generateId={shortid.generate}
    facilitySuggester={facilitySuggester}
    patientSuggester={patientSuggester}
  />
));

storiesOf('Forms', module).add('PatientDetailsForm', () => (
  <PatientDetailsForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    generateId={shortid.generate}
    facilitySuggester={facilitySuggester}
    patientSuggester={patientSuggester}
  />
));

const testCategories = [{ label: 'Sweet', value: 'sweet' }, { label: 'Savoury', value: 'savoury' }];

const testTypes = [
  { name: 'Grape', _id: 'grape', category: { _id: 'sweet' } },
  { name: 'Vanilla', _id: 'vanilla', category: { _id: 'sweet' } },
  { name: 'Chocolate', _id: 'chocolate', category: { _id: 'sweet' } },
  { name: 'Boysenberry', _id: 'boysenberry', category: { _id: 'sweet' } },
  { name: 'Strawberry', _id: 'strawb', category: { _id: 'sweet' } },
  { name: 'Lemon', _id: 'lemon', category: { _id: 'sweet' } },
  { name: 'Pepper', _id: 'pepper', category: { _id: 'savoury' } },
  { name: 'Cabbage', _id: 'cabbage', category: { _id: 'savoury' } },
  { name: 'Sprout', _id: 'sprout', category: { _id: 'savoury' } },
  { name: 'Yeast', _id: 'yeast', category: { _id: 'savoury' } },
  { name: 'Zucchini', _id: 'zuc', category: { _id: 'savoury' } },
  { name: 'Egg', _id: 'egg', category: { _id: 'savoury' } },
  { name: 'Chicken', _id: 'chicken', category: { _id: 'savoury' } },
  { name: 'Leek', _id: 'leek', category: { _id: 'savoury' } },
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

storiesOf('Forms', module).add('ReferralForm', () => (
  <ReferralForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
    icd10Suggester={icd10Suggester}
  />
));

storiesOf('Forms', module).add('DeathForm', () => (
  <DeathForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    practitionerSuggester={practitionerSuggester}
    icd10Suggester={icd10Suggester}
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
      generateId={shortid.generate}
      practitionerSuggester={practitionerSuggester}
    />
  ))
  .add('TestSelector', () => <StorybookableTestSelector />);
