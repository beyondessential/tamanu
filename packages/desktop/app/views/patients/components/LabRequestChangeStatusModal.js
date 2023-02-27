import React from 'react';
import { LAB_REQUEST_STATUSES } from 'shared/constants/labs';
import * as yup from 'yup';
import {
  ConfirmCancelRow,
  DateTimeField,
  Field,
  FormGrid,
  Modal,
  SuggesterSelectField,
  Form,
  SelectField,
} from '../../../components';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../../constants';

const validationSchema = yup.object().shape({
  status: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_STATUSES))
    .required(),
  sampleTime: yup.string().when('status', {
    is: LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    then: yup.string().required(),
    otherwise: yup.string().nullable(),
  }),
  labSampleSiteId: yup.string(),
});

export const LabRequestChangeStatusModal = React.memo(({ status, updateLabReq, open, onClose }) => {
  const updateLabStatus = async formValues => {
    console.log('values', formValues);
    // await updateLabReq({ status: values.status });
    onClose();
  };

  return (
    <>
      <Modal open={true} onClose={onClose} title="Change lab request status">
        <Form
          onSubmit={updateLabStatus}
          initialValues={{ status }}
          validationSchema={validationSchema}
          showInlineErrorsOnly
          render={({ values, submitForm }) => (
            <FormGrid columns={1}>
              <Field
                label="Status"
                name="status"
                options={LAB_REQUEST_STATUS_OPTIONS}
                component={SelectField}
              />
              {values.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED && (
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
              <ConfirmCancelRow confirmText="Confirm" onCancel={onClose} onConfirm={submitForm} />
            </FormGrid>
          )}
        />
      </Modal>
    </>
  );
});
