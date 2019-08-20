import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { TextField, SelectField } from '../app/components';

import { Button } from '../app/components/Button';
import { FormGrid } from '../app/components/FormGrid';
import { Field, Form } from '../app/components/Field/Form';
import { PaginatedForm } from '../app/components/Field/PaginatedForm';

storiesOf('FormBehaviour', module).add('PaginatedForm', () => (
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

async function asyncSubmit(data) {
  action('submitStart')(data);

  await new Promise(resolve => setTimeout(resolve, 1000));

  action('submitEnd')(data);
}

storiesOf('FormBehaviour', module).add('Async submission form', () => (
  <Form
    onSubmit={asyncSubmit}
    render={({ submitForm, isSubmitting }) => (
      <FormGrid>
        <Field name="value" label="Value" component={TextField} />
        <Button onClick={submitForm} disabled={isSubmitting} color="primary" variant="contained">
          {isSubmitting ? '...' : 'Submit'}
        </Button>
      </FormGrid>
    )}
  />
));

async function asyncSubmitWithError(data, { setErrors }) {
  action('submitStart')(data);

  await new Promise(resolve => setTimeout(resolve, 1000));

  setErrors({
    message: 'This will not work',
  });

  action('submitEnd')(data);
}

storiesOf('FormBehaviour', module).add('With async error', () => (
  <Form
    onSubmit={asyncSubmitWithError}
    render={({ submitForm, isSubmitting }) => (
      <FormGrid>
        <Field name="value" label="Value" component={TextField} />
        <Button onClick={submitForm} disabled={isSubmitting} color="primary" variant="contained">
          {isSubmitting ? '...' : 'Submit'}
        </Button>
      </FormGrid>
    )}
  />
));
