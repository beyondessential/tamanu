import React from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_FORM_TYPES, LAB_REQUEST_STATUSES } from 'shared/constants/labs';
import { getCurrentDateString } from 'shared/utils/dateTime';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  FormSeparatorLine,
  RadioField,
  SuggesterSelectField,
} from '../../components';
import { binaryOptions } from '../../constants';
import { foreignKey } from '../../utils/validation';

export const screen1ValidationSchema = yup.object().shape({
  requestedById: foreignKey('Requesting clinician is required'),
  requestedDate: yup.date().required('Request date is required'),
  requestFormType: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_FORM_TYPES))
    .required('Select type must be selected'),
  specimenAttached: yup
    .string()
    .oneOf(binaryOptions.map(o => o.value))
    .required(),
  sampleTime: yup.string().when('specimenAttached', {
    is: 'yes',
    then: yup.string().required(),
    otherwise: yup.string().nullable(),
  }),
  status: yup
    .string()
    .oneOf([LAB_REQUEST_STATUSES.RECEPTION_PENDING, LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED])
    .required(),
});

export const LabRequestFormScreen1 = ({
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
      setFieldValue('status', LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);
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
          name="requestFormType"
          label="Select your request type"
          component={RadioField}
          options={[
            {
              label: 'Panel',
              description: 'Select from a list of test panels',
              value: LAB_REQUEST_FORM_TYPES.PANEL,
            },
            {
              label: 'Individual',
              description: 'Select any individual or range of individual test types',
              value: LAB_REQUEST_FORM_TYPES.INDIVIDUAL,
            },
          ]}
        />
      </div>
    </>
  );
};
