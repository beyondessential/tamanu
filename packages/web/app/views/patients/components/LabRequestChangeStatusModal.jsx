import React from 'react';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_LABELS } from '@tamanu/constants/labs';
import * as yup from 'yup';

import {
  DateTimeField,
  Field,
  Form,
  FormGrid,
  FormModal,
  FormSubmitCancelRow,
  SuggesterSelectField,
  TranslatedSelectField,
} from '../../../components';
import { FORM_TYPES } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const validationSchema = yup.object().shape({
  status: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_STATUSES))
    .required()
    .translatedLabel(<TranslatedText
    stringId="general.status.label"
    fallback="Status"
    data-test-id='translatedtext-faka' />),
  sampleTime: yup.string().when('status', {
    is: status => status !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    then: yup
      .string()
      .translatedLabel(
        <TranslatedText
          stringId="lab.modal.changeStatus.sampleDateTime.label"
          fallback="Sample date & time"
          data-test-id='translatedtext-ffpu' />,
      )
      .required(),
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
          formType={FORM_TYPES.EDIT_FORM}
          render={({ values, submitForm }) => {
            const shouldIncludeOption = option =>
              (![
                LAB_REQUEST_STATUSES.DELETED,
                LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
                LAB_REQUEST_STATUSES.CANCELLED,
              ].includes(option.value) ||
                option.value === values.status) &&
              (labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED ||
                option.value !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED);

            return (
              <FormGrid columns={1}>
                <Field
                  label={<TranslatedText
                    stringId="general.status.label"
                    fallback="Status"
                    data-test-id='translatedtext-8ry7' />}
                  name="status"
                  enumValues={LAB_REQUEST_STATUS_LABELS}
                  transformOptions={options => options.filter(shouldIncludeOption)}
                  component={TranslatedSelectField}
                  required
                  data-test-id='field-j8cw' />
                {labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED &&
                  values.status !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED && (
                    <>
                      <Field
                        name="sampleTime"
                        label={
                          <TranslatedText
                            stringId="lab.modal.changeStatus.sampleDateTime.label"
                            fallback="Sample date & time"
                            data-test-id='translatedtext-f5ld' />
                        }
                        required
                        component={DateTimeField}
                        saveDateAsString
                        data-test-id='field-c9w3' />
                      <Field
                        name="labSampleSiteId"
                        label={<TranslatedText
                          stringId="lab.site.label"
                          fallback="Site"
                          data-test-id='translatedtext-te9w' />}
                        component={SuggesterSelectField}
                        endpoint="labSampleSite"
                        data-test-id='field-jmqw' />
                    </>
                  )}
                <FormSubmitCancelRow
                  confirmText="Confirm"
                  onCancel={onClose}
                  onConfirm={submitForm}
                  data-test-id='formsubmitcancelrow-9wun' />
              </FormGrid>
            );
          }}
        />
      </FormModal>
    );
  },
);
