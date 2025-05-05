import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { MemoryRouter, Route } from 'react-router-dom';
import styled from 'styled-components';
import { MobileSurveyScreen } from '../app/components/Surveys/MobileSurveyScreen';
import { Form, Formik } from 'formik';

// Mock context providers
const MockProviders = ({ children }) => {
  // Normally we'd set up all required providers here
  // For simplicity in Storybook, we'll just use MemoryRouter
  return <MemoryRouter>{children}</MemoryRouter>;
};

// Mobile device container for proper sizing
const MobileContainer = styled.div`
  width: 375px;
  height: 667px;
  border: 1px solid #ccc;
  border-radius: 16px;
  overflow: hidden;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

// Mock data for survey components
const mockSurvey = {
  id: 'survey-123',
  name: 'General pre-admission patient form',
  components: [
    {
      id: 'component-1',
      dataElementId: 'firstName',
      text: 'First name',
      dataElement: {
        id: 'firstName',
        type: 'FreeText',
        defaultText: 'First name',
      },
      validationCriteria: { mandatory: 'true' },
    },
    {
      id: 'component-2',
      dataElementId: 'lastName',
      text: 'Last name',
      dataElement: {
        id: 'lastName',
        type: 'FreeText',
        defaultText: 'Last name',
      },
      validationCriteria: { mandatory: 'true' },
    },
    {
      id: 'component-3',
      dataElementId: 'dateOfBirth',
      text: 'Date of birth',
      dataElement: {
        id: 'dateOfBirth',
        type: 'Date',
        defaultText: 'Date of birth',
      },
      validationCriteria: { mandatory: 'true' },
    },
    {
      id: 'component-4',
      dataElementId: 'gender',
      text: 'Gender',
      dataElement: {
        id: 'gender',
        type: 'SingleSelect',
        defaultText: 'Gender',
        defaultOptions: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Other', value: 'other' },
        ],
      },
      validationCriteria: { mandatory: 'true' },
    },
    {
      id: 'component-5',
      dataElementId: 'address',
      text: 'Residential address',
      dataElement: {
        id: 'address',
        type: 'FreeText',
        defaultText: 'Residential address',
      },
      validationCriteria: { mandatory: 'true' },
    },
    {
      id: 'component-6',
      dataElementId: 'phoneNumber',
      text: 'Phone number',
      dataElement: {
        id: 'phoneNumber',
        type: 'FreeText',
        defaultText: 'Phone number',
      },
      validationCriteria: { mandatory: 'true' },
    },
    {
      id: 'component-7',
      dataElementId: 'emergencyContact',
      text: 'Emergency contact name',
      dataElement: {
        id: 'emergencyContact',
        type: 'FreeText',
        defaultText: 'Emergency contact name',
      },
      validationCriteria: { mandatory: 'true' },
    },
  ],
};

const mockPatient = {
  id: 'patient-123',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1980-01-01',
};

// Mock functions
const mockSetFieldValue = (field, value) => {
  console.log(`Setting ${field} to ${value}`);
  action('setFieldValue')(field, value);
};

const mockValidateForm = () => {
  action('validateForm')();
  return Promise.resolve({});
};

// Reusable mock form component
const MockSurveyForm = () => {
  const initialValues = {};
  mockSurvey.components.forEach(component => {
    initialValues[component.dataElementId] = '';
  });

  return (
    <Formik initialValues={initialValues} onSubmit={action('submit')}>
      {({ values, errors, setFieldValue, validateForm, setErrors, status, setStatus }) => (
        <Form style={{ height: '100%' }}>
          <MobileSurveyScreen
            title={mockSurvey.name}
            allComponents={mockSurvey.components}
            values={values}
            setFieldValue={setFieldValue}
            onStepBack={action('stepBack')}
            onSubmit={action('submit')}
            patient={mockPatient}
            validateForm={validateForm}
            setErrors={setErrors}
            errors={errors}
            status={status}
            setStatus={setStatus}
          />
        </Form>
      )}
    </Formik>
  );
};

// Stories
storiesOf('Patient Portal', module)
  .add('Mobile Survey Screen', () => (
    <MobileContainer>
      <MobileSurveyScreen
        title="General pre-admission patient form"
        allComponents={mockSurvey.components}
        values={{}}
        setFieldValue={mockSetFieldValue}
        onStepBack={action('stepBack')}
        onSubmit={action('submit')}
        patient={mockPatient}
        validateForm={mockValidateForm}
        setErrors={action('setErrors')}
        errors={{}}
        status={{}}
        setStatus={action('setStatus')}
      />
    </MobileContainer>
  ))
  .add('Mobile Survey Response Form', () => (
    <MockProviders>
      <MobileContainer>
        <MockSurveyForm />
      </MobileContainer>
    </MockProviders>
  ))
  .add('Patient Portal Flow', () => {
    // Our mobile view rendered with a route-based example
    return (
      <MemoryRouter initialEntries={['/patient-portal/surveys/survey-123']}>
        <MobileContainer>
          <Route
            path="/patient-portal/surveys/:surveyId"
            render={() => (
              // Render our MockSurveyForm which simulates the patient portal survey form
              <MockSurveyForm />
            )}
          />
        </MobileContainer>
      </MemoryRouter>
    );
  });
