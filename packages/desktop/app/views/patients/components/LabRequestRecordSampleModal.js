import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { LAB_REQUEST_STATUSES } from '@tamanu/shared/constants';
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
    const sampleNotCollected = labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED;

    const updateSample = async formValues => {
      await updateLabReq({
        ...formValues,
        // If lab request sample is marked as not collected in initial form - mark it as reception pending on submission
        ...(sampleNotCollected && {
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
          title={sampleNotCollected ? 'Record sample' : 'Edit sample date and time'}
        >
          <Form
            onSubmit={updateSample}
            validationSchema={validationSchema}
            showInlineErrorsOnly
            initialValues={{
              sampleTime: labRequest.sampleTime || getCurrentDateTimeString(),
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
