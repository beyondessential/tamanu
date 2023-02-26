import React from 'react';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { getCurrentDateString, getCurrentDateTimeString } from 'shared/utils/dateTime';

import { LAB_REQUEST_SELECT_LAB_METHOD, LAB_REQUEST_STATUSES } from 'shared/constants/labs';
import { useQuery } from '@tanstack/react-query';
import { foreignKey } from '../utils/validation';
import { binaryOptions } from '../constants';
import { useAuth } from '../contexts/Auth';

import {
  Field,
  AutocompleteField,
  SuggesterSelectField,
  DateTimeField,
  RadioField,
} from '../components/Field';
import { FormSeparatorLine } from '../components/FormSeparatorLine';
import { MultiStepForm, FormStep } from './MultiStepForm';
import { TestSelectorField } from '../views/labRequest/TestSelector';
import { useApi } from '../api';

const labRequestValidationSchema = yup.object().shape({
  requestedById: foreignKey('Requesting clinician is required'),
  requestedDate: yup.date().required('Request date is required'),
  requestType: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_SELECT_LAB_METHOD))
    .required('Select type must be selected'),
  specimenAttached: yup
    .string()
    .oneOf(binaryOptions.map(o => o.value))
    .required(),
  sampleTime: yup.string().when('specimenAttached', {
    is: 'yes',
    then: yup.string().required(''),
    otherwise: yup.string().nullable(),
  }),
  status: yup
    .string()
    .oneOf([LAB_REQUEST_STATUSES.RECEPTION_PENDING, LAB_REQUEST_STATUSES.NOT_COLLECTED])
    .required(),
});

const labRequestTestSelectorSchema = yup.object().shape({
  labTestIds: yup
    .array()
    .of(yup.string())
    .required(),
});

const LabRequestFormScreen1 = ({
  values,
  setFieldValue,
  handleChange,
  practitionerSuggester,
  departmentSuggester,
}) => {
  const handleToggleSampleCollected = event => {
    handleChange(event);
    const isSampleCollected = event.target.value === 'yes';
    if (isSampleCollected) {
      setFieldValue('sampleTime', getCurrentDateString());
      setFieldValue('status', LAB_REQUEST_STATUSES.RECEPTION_PENDING);
    } else {
      setFieldValue('sampleTime', null);
      setFieldValue('status', LAB_REQUEST_STATUSES.NOT_COLLECTED);
    }
  };

  return (
    <>
      <Field
        name="requestedById"
        label="Requesting clinician"
        required
        component={AutocompleteField}
        suggester={practitionerSuggester}
      />
      <Field
        name="requestedDate"
        label="Request date & time"
        required
        component={DateTimeField}
        saveDateAsString
      />
      <Field
        name="departmentId"
        label="Department"
        component={AutocompleteField}
        suggester={departmentSuggester}
      />
      <Field
        name="labTestPriorityId"
        label="Priority"
        component={SuggesterSelectField}
        endpoint="labTestPriority"
      />
      <FormSeparatorLine />
      <div style={{ gridColumn: '1 / -1' }}>
        <Field
          name="specimenAttached"
          label="Sample collected"
          required
          component={RadioField}
          onChange={handleToggleSampleCollected}
          options={binaryOptions}
        />
      </div>
      {values.specimenAttached === 'yes' && (
        <>
          <Field
            name="sampleTime"
            label="Sample date & time"
            required
            component={DateTimeField}
            saveDateAsString
          />
          <Field
            name="labSampleSiteId"
            label="Site"
            component={SuggesterSelectField}
            endpoint="labSampleSite"
          />
        </>
      )}
      <FormSeparatorLine />
      <div style={{ gridColumn: '1 / -1' }}>
        <Field
          required
          name="requestType"
          label="Select your request type"
          component={RadioField}
          options={[
            {
              label: 'Panel',
              description: 'Select from a list of test panels',
              value: LAB_REQUEST_SELECT_LAB_METHOD.PANEL,
            },
            {
              label: 'Individual',
              description: 'Select any individual or range of individual test types',
              value: LAB_REQUEST_SELECT_LAB_METHOD.INDIVIDUAL,
            },
          ]}
        />
      </div>
    </>
  );
};

const LabRequestFormScreen2 = props => {
  const api = useApi();
  const { data: testTypesData, isLoading } = useQuery(
    ['labTestTypes'],
    () => api.get('labTestType'),
    {
      refetchOnWindowFocus: false,
    },
  );

  if (isLoading) return null;

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <Field
        name="labTestIds"
        label="Lab tests"
        component={TestSelectorField}
        testTypes={testTypesData}
        {...props}
      />
    </div>
  );
};

export const LabRequestForm = ({
  practitionerSuggester,
  departmentSuggester,
  encounter,
  onSubmit,
  onCancel,
  editedObject,
  generateDisplayId,
}) => {
  const { currentUser } = useAuth();
  return (
    <MultiStepForm
      onCancel={onCancel}
      onSubmit={onSubmit}
      initialValues={{
        displayId: generateDisplayId(),
        requestedById: currentUser.id,
        departmentId: encounter.departmentId,
        requestedDate: getCurrentDateTimeString(),
        specimenAttached: 'no',
        status: LAB_REQUEST_STATUSES.NOT_COLLECTED,
        // LabTest date
        date: getCurrentDateString(),
        ...editedObject,
      }}
      validationSchema={labRequestValidationSchema}
    >
      <FormStep validationSchema={labRequestValidationSchema}>
        <LabRequestFormScreen1
          practitionerSuggester={practitionerSuggester}
          departmentSuggester={departmentSuggester}
        />
      </FormStep>
      <FormStep validationSchema={labRequestTestSelectorSchema}>
        <LabRequestFormScreen2 />
      </FormStep>
    </MultiStepForm>
  );
};

LabRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  practitionerSuggester: PropTypes.object.isRequired,
  encounter: PropTypes.object,
  generateDisplayId: PropTypes.func.isRequired,
  editedObject: PropTypes.object,
};

LabRequestForm.defaultProps = {
  encounter: {},
  editedObject: {},
};
