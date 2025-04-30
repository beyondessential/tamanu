import React from 'react';
import { action } from '@storybook/addon-actions';
import styled from 'styled-components';
import { Button, Field, Form, FormGrid, TextField } from '../../app/components';

async function asyncSubmit(data) {
  action('submitStart')(data);

  await new Promise(resolve => {
    setTimeout(resolve, 1000);
  });

  action('submitEnd')(data);
}

const StyledFormGrid = styled(FormGrid)`
  align-items: end;
`;

const StyledButton = styled(Button)`
  padding: 14px 20px;
`;

export default {
  title: 'Forms',
  component: Form,
};

export const AsyncSubmissionForm = () => (
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
);

async function asyncSubmitWithError(data, { setErrors }) {
  action('submitStart')(data);

  await new Promise(resolve => {
    setTimeout(resolve, 1000);
  });

  setErrors({
    message: 'This will not work',
  });

  action('submitEnd')(data);
}

export const WithAsyncError = () => (
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
);
