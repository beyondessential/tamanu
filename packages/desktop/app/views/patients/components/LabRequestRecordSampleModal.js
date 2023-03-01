import React from 'react';
import * as yup from 'yup';
import { LAB_REQUEST_STATUSES } from 'shared/constants';
import {
  ConfirmCancelRow,
  FormGrid,
  Modal,
  SuggesterSelectField,
  Form,
  Field,
  DateTimeField,
} from '../../../components';

const validationSchema = yup.object().shape({
  sampleTime: yup.date().required(),
  labSampleSiteId: yup.string(),
});

export const LabRequestRecordSampleModal = React.memo(
  ({ updateLabReq, labRequest, open, onClose }) => {
    const isEdit = !!labRequest.sampleTime;

    const updateSample = async formValues => {
      await updateLabReq({
        ...formValues,
        // If lab request sample is marked as not collected in initial form - mark it as reception pending on submission
        ...(labRequest.status === LAB_REQUEST_STATUSES.NOT_COLLECTED && {
          status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
          specimenCollected: true,
        }),
      });
      onClose();
    };

    return (
      <>
        <Modal
          open={open}
          onClose={onClose}
          title={isEdit ? 'Edit sample date and time' : 'Record sample'}
        >
          <Form
            onSubmit={updateSample}
            validationSchema={validationSchema}
            showInlineErrorsOnly
            initialValues={{
              sampleTime: labRequest.sampleTime,
              labSampleSiteId: labRequest.labSampleSiteId,
            }}
            render={({ submitForm }) => (
              <FormGrid columns={1}>
                <Field
                  name="sampleTime"
                  label="Sample date & time"
                  required
                  component={DateTimeField}
                />
                <Field
                  name="labSampleSiteId"
                  label="Site"
                  component={SuggesterSelectField}
                  endpoint="labSampleSite"
                />
                <ConfirmCancelRow onConfirm={submitForm} confirmText="Confirm" onCancel={onClose} />
              </FormGrid>
            )}
          />
        </Modal>
      </>
    );
  },
);
