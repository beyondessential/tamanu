import React from 'react';
import * as yup from 'yup';

import { LAB_REQUEST_STATUSES } from 'shared/constants/labs';
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

export const LabRequestChangeStatusModal = React.memo(
  ({ labRequest, updateLabReq, open, onClose }) => {
    const updateLabStatus = async formValues => {
      await updateLabReq(formValues);
      onClose();
    };

    return (
      <Modal open={open} onClose={onClose} title="Change lab request status">
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
                component={SelectField}
                required
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
              <ConfirmCancelRow confirmText="Confirm" onCancel={onClose} onConfirm={submitForm} />
            </FormGrid>
          )}
        />
      </Modal>
    );
  },
);
