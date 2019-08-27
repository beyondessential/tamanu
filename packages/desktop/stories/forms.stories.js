import React from 'react';

import shortid from 'shortid';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { LoginView } from '../app/views/LoginView';
import { VisitForm } from '../app/forms/VisitForm';
import { VitalsForm } from '../app/forms/VitalsForm';
import { ProcedureForm } from '../app/forms/ProcedureForm';
import { AllergyForm } from '../app/forms/AllergyForm';
import { OngoingConditionForm } from '../app/forms/OngoingConditionForm';
import { DischargeForm } from '../app/forms/DischargeForm';
import { NewPatientForm } from '../app/forms/NewPatientForm';
import { LabRequestForm } from '../app/forms/LabRequestForm';

import { createDummyVisit, PATIENTS, LOCATIONS, PRACTITIONERS, FACILITIES } from './dummyPatient';

function createDummySuggester(options) {
  return {
    fetchSuggestions: search => {
      const filter = ({ label }) => label.toLowerCase().includes(search.toLowerCase());
      return options.filter(filter);
    },
    fetchCurrentOption: value => options.find(s => s.value === value),
  };
}

const practitionerSuggester = createDummySuggester(PRACTITIONERS);
const locationSuggester = createDummySuggester(LOCATIONS);
const facilitySuggester = createDummySuggester(FACILITIES);
const patientSuggester = createDummySuggester(
  PATIENTS.map(({ firstName, lastName, _id }) => ({
    label: `${firstName} ${lastName}`,
    value: _id,
  })),
);

storiesOf('Forms', module).add('LoginForm', () => <LoginView login={action('login')} />);

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

storiesOf('Forms', module).add('ProcedureForm', () => (
  <ProcedureForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    locationSuggester={locationSuggester}
    practitionerSuggester={practitionerSuggester}
    cptCodeSuggester={createDummySuggester(['CPT 1', 'CPT 2', 'CPT 3', 'CPT 4'])}
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
    visit={createDummyVisit(false)}
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

storiesOf('Forms', module).add('LabRequestForm', () => (
  <LabRequestForm
    onSubmit={action('submit')}
    onCancel={action('cancel')}
    visit={{
      visitType: 'admission',
      startDate: new Date(),
      supervisingDoctor: {
        displayName: "Dr Jim Taylor"
      }
    }}
    generateId={shortid.generate}
    practitionerSuggester={practitionerSuggester}
  />
));
