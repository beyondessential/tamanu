import React from 'react';

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import styled from 'styled-components';
import { TextField } from '../app/components';

import { Button } from '../app/components/Button';
import { FormGrid } from '../app/components/FormGrid';
import { Field, Form } from '../app/components/Field';

async function asyncSubmit(data) {
  action('submitStart')(data);

  await new Promise(resolve => setTimeout(resolve, 1000));

  action('submitEnd')(data);
}

const StyledFormGrid = styled(FormGrid)`
  align-items: end;
`;

const StyledButton = styled(Button)`
  padding: 14px 20px;
`;

storiesOf('FormBehaviour', module).add('Async submission form', () => (
  <Form
    onSubmit={asyncSubmit}
    render={({ submitForm, isSubmitting }) => (
      <StyledFormGrid>
        <Field name="value" label="Value" component={TextField} />
        <StyledButton
          onClick={submitForm}
          disabled={isSubmitting}
          color="primary"
          variant="contained"
        >
          {isSubmitting ? '...' : 'Submit'}
        </StyledButton>
      </StyledFormGrid>
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
      <StyledFormGrid>
        <Field name="value" label="Value" component={TextField} />
        <StyledButton
          onClick={submitForm}
          disabled={isSubmitting}
          color="primary"
          variant="contained"
        >
          {isSubmitting ? '...' : 'Submit'}
        </StyledButton>
      </StyledFormGrid>
    )}
  />
));
