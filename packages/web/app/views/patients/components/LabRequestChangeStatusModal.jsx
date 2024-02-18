import React from 'react';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants/labs';
import * as yup from 'yup';

import {
  DateTimeField,
  Field,
  Form,
  FormGrid,
  FormModal,
  FormSubmitCancelRow,
  BaseSelectField,
  SuggesterSelectField,
} from '../../../components';

import { LAB_REQUEST_STATUS_OPTIONS } from '../../../constants';
import { TranslatedSelectField } from '../../../components/Translation/TranslatedSelectField.jsx';

const validationSchema = yup.object().shape({
  status: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_STATUSES))
    .required(),
  sampleTime: yup.string().when('status', {
    is: status => status !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    then: yup.string().required('Sample date & time is required'),
    otherwise: yup.string().nullable(),
  }),
  labSampleSiteId: yup.string(),
});

export const LabRequestChangeStatusModal = React.memo(
  ({ labRequest, updateLabReq, open, onClose }) => {
    const updateLabStatus = async formValues => {
      await updateLabReq(formValues);
      onClose();
    };

    return (
      <FormModal open={open} onClose={onClose} title="Change lab request status">
        <Form
          onSubmit={updateLabStatus}
          initialValues={labRequest}
          validationSchema={validationSchema}
          showInlineErrorsOnly
          render={({ values, submitForm }) => (
            <FormGrid columns={1}>
              <Field
                label="Status"
                name="status"
                options={LAB_REQUEST_STATUS_OPTIONS}
                component={TranslatedSelectField}
                required
                prefix="lab.property.status"
              />
              {labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED &&
                values.status !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED && (
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
              <FormSubmitCancelRow
                confirmText="Confirm"
                onCancel={onClose}
                onConfirm={submitForm}
              />
            </FormGrid>
          )}
        />
      </FormModal>
    );
  },
);
