import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { TextField, SelectField } from '../app/components';

import { Field } from '../app/components/Field/Form';
import { PaginatedForm } from '../app/components/Field/PaginatedForm';
import Login from '../app/containers/Auth/Login';
import { VisitForm } from '../app/forms/VisitForm';
import { ProcedureForm } from '../app/forms/ProcedureForm';
import { AllergyForm } from '../app/forms/AllergyForm';
import { OngoingConditionForm } from '../app/forms/OngoingConditionForm';

import { createDummyVisit, LOCATIONS, PRACTITIONERS } from './dummyPatient';

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

storiesOf('Forms', module).add('PaginatedForm', () => (
  <PaginatedForm
    onSubmit={action('submit')}
    initialValues={{
      city: '',
      country: 'VU',
    }}
    pages={[
      () => <Field name="city" label="City" component={TextField} />,
      () => (
        <Field
          name="country"
          label="Country"
          component={SelectField}
          options={[
            { value: 'TO', label: 'Tonga' },
            { value: 'VU', label: 'Vanuatu' },
            { value: 'CK', label: 'Cook Islands' },
          ]}
        />
      ),
      () => <Field name="comment" label="Comment" component={TextField} />,
    ]}
  />
));

storiesOf('Forms', module).add('LoginForm', () => <Login login={action('login')} />);

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
