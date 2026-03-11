import React from 'react';
import { LAB_REQUEST_STATUSES, LAB_REQUEST_STATUS_LABELS } from '@tamanu/constants/labs';
import * as yup from 'yup';
import { TranslatedSelectField, Form, FormGrid, FormSubmitCancelRow } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  DateTimeField,
  Field,
  FormModal,
  SuggesterSelectField,
} from '../../../components';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const validationSchema = yup.object().shape({
  status: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_STATUSES))
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
    .translatedLabel(
      <TranslatedText
        stringId="general.status.label"
        fallback="Status"
        data-testid="translatedtext-mdbk"
      />,
    ),
  sampleTime: yup.string().when('status', {
    is: status => status !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    then: yup
      .string()
      .translatedLabel(
        <TranslatedText
          stringId="lab.modal.changeStatus.sampleDateTime.label"
          fallback="Sample date & time"
          data-testid="translatedtext-iquc"
        />,
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
      <FormModal
        open={open}
        onClose={onClose}
        title="Change lab request status"
        data-testid="formmodal-79e2"
      >
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
              <FormGrid columns={1} data-testid="formgrid-9tm6">
                <Field
                  label={
                    <TranslatedText
                      stringId="general.status.label"
                      fallback="Status"
                      data-testid="translatedtext-bs5g"
                    />
                  }
                  name="status"
                  enumValues={LAB_REQUEST_STATUS_LABELS}
                  transformOptions={options => options.filter(shouldIncludeOption)}
                  component={TranslatedSelectField}
                  required
                  data-testid="field-ruix"
                />
                {labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED &&
                  values.status !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED && (
                    <>
                      <Field
                        name="sampleTime"
                        label={
                          <TranslatedText
                            stringId="lab.modal.changeStatus.sampleDateTime.label"
                            fallback="Sample date & time"
                            data-testid="translatedtext-lkfl"
                          />
                        }
                        required
                        component={DateTimeField}
                        data-testid="field-81ia"
                      />
                      <Field
                        name="labSampleSiteId"
                        label={
                          <TranslatedText
                            stringId="lab.site.label"
                            fallback="Site"
                            data-testid="translatedtext-ei3x"
                          />
                        }
                        component={SuggesterSelectField}
                        endpoint="labSampleSite"
                        data-testid="field-bqq5"
                      />
                    </>
                  )}
                <FormSubmitCancelRow
                  confirmText="Confirm"
                  onCancel={onClose}
                  onConfirm={submitForm}
                  data-testid="formsubmitcancelrow-4wm0"
                />
              </FormGrid>
            );
          }}
          data-testid="form-90ij"
        />
      </FormModal>
    );
  },
);
