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
  SuggesterSelectField,
  SelectField,
} from '../../../components';

import { FORM_TYPES, LAB_REQUEST_STATUS_OPTIONS } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const validationSchema = yup.object().shape({
  status: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_STATUSES))
    .required()
    .translatedLabel(<TranslatedText stringId="general.status.label" fallback="Status" />),
  sampleTime: yup.string().when('status', {
    is: status => status !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED,
    then: yup
      .string()
      .translatedLabel(
        <TranslatedText
          stringId="lab.modal.changeStatus.sampleDateTime.label"
          label="Sample date & time"
        />,
      ),
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
          render={({ values, submitForm }) => (
            <FormGrid columns={1}>
              <Field
                label="Status"
                name="status"
                options={LAB_REQUEST_STATUS_OPTIONS}
                component={SelectField}
                required
                prefix="lab.property.status"
              />
              {labRequest.status === LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED &&
                values.status !== LAB_REQUEST_STATUSES.SAMPLE_NOT_COLLECTED && (
                  <>
                    <Field
                      name="sampleTime"
                      label={
                        <TranslatedText
                          stringId="lab.modal.changeStatus.sampleDateTime.label"
                          label="Sample date & time"
                        />
                      }
                      required
                      component={DateTimeField}
                      saveDateAsString
                    />
                    <Field
                      name="labSampleSiteId"
                      label={<TranslatedText stringId="lab.site.label" label="Site" />}
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
