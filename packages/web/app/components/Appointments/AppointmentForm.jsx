import React, { useCallback } from 'react';
import * as yup from 'yup';
import { APPOINTMENT_STATUSES, FORM_TYPES } from '@tamanu/constants';
import { Form, FormGrid, FormSubmitCancelRow } from '@tamanu/ui-components';
import { AutocompleteField, DateTimeField, Field } from '../Field';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { useApi, usePatientSuggester, useSuggester } from '../../api';
import { TranslatedText } from '../Translation/TranslatedText';

export const AppointmentForm = (props) => {
  const { onSuccess = () => {}, onCancel, appointment } = props;
  const api = useApi();
  const isUpdating = !!appointment;
  const clinicianSuggester = useSuggester('practitioner');
  const patientSuggester = usePatientSuggester();
  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const appointmentTypeSuggester = useSuggester('appointmentType');

  let initialValues = {};
  if (isUpdating) {
    initialValues = {
      patientId: appointment.patientId,
      appointmentTypeId: appointment.appointmentTypeId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      clinicianId: appointment.clinicianId,
      locationGroupId: appointment.locationGroupId,
    };
  }
  const createAppointment = useCallback(
    async (values) => {
      if (isUpdating) {
        const updated = {
          ...values,
        };
        // if rescheduling, change status to confirmed
        if (values.startTime !== initialValues.startTime) {
          updated.status = APPOINTMENT_STATUSES.CONFIRMED;
        }
        await api.put(`appointments/${appointment.id}`, updated);
      } else {
        await api.post('appointments', {
          ...values,
        });
      }
      onSuccess();
    },
    [api, appointment, initialValues.startTime, isUpdating, onSuccess],
  );
  return (
    <Form
      initialValues={initialValues}
      formType={isUpdating ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      onSubmit={createAppointment}
      validationSchema={yup.object().shape({
        patientId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.patient.label"
              fallback="Patient"
              data-testid="translatedtext-nkcd"
            />,
          ),
        appointmentTypeId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="appointment.appointmentType.label"
              fallback="Appointment type"
              data-testid="translatedtext-apqt"
            />,
          ),
        startTime: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.startTime.label"
              fallback="Start time"
              data-testid="translatedtext-riaa"
            />,
          ),
        clinicianId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
              data-testid="translatedtext-v777"
            />,
          ),
        locationGroupId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.area.label"
              fallback="Area"
              data-testid="translatedtext-fni0"
            />,
          )
          .nullable(),
      })}
      render={({ submitForm }) => (
        <>
          <FormGrid columns={1} data-testid="formgrid-12q6">
            <Field
              label={
                <TranslatedText
                  stringId="general.patient.label"
                  fallback="Patient"
                  data-testid="translatedtext-vs8y"
                />
              }
              name="patientId"
              component={AutocompleteField}
              suggester={patientSuggester}
              required
              data-testid="field-a972"
            />
            <FormSeparatorLine data-testid="formseparatorline-hkvh" />
            <Field
              label={
                <TranslatedText
                  stringId="appointment.appointmentType.label"
                  fallback="Appointment type"
                  data-testid="translatedtext-s250"
                />
              }
              name="appointmentTypeId"
              component={AutocompleteField}
              suggester={appointmentTypeSuggester}
              required
              data-testid="field-d6mj"
            />
          </FormGrid>
          <div style={{ marginTop: '1rem' }}>
            <FormGrid data-testid="formgrid-ws90">
              <Field
                label={
                  <TranslatedText
                    stringId="general.startTime.label"
                    fallback="Start time"
                    data-testid="translatedtext-klp9"
                  />
                }
                name="startTime"
                component={DateTimeField}
                required
                data-testid="field-g827"
              />
              <Field
                label={
                  <TranslatedText
                    stringId="general.endTime.label"
                    fallback="End time"
                    data-testid="translatedtext-124g"
                  />
                }
                name="endTime"
                component={DateTimeField}
                data-testid="field-niam"
              />
              <Field
                label={
                  <TranslatedText
                    stringId="general.localisedField.clinician.label.short"
                    fallback="Clinician"
                    data-testid="translatedtext-7ado"
                  />
                }
                name="clinicianId"
                component={AutocompleteField}
                suggester={clinicianSuggester}
                required
                data-testid="field-5wwv"
              />
              <Field
                label={
                  <TranslatedText
                    stringId="general.area.label"
                    fallback="Area"
                    data-testid="translatedtext-bi99"
                  />
                }
                name="locationGroupId"
                component={AutocompleteField}
                suggester={locationGroupSuggester}
                required
                autofill
                data-testid="field-hjps"
              />
              <FormSeparatorLine data-testid="formseparatorline-ebwx" />
              <FormSubmitCancelRow
                onCancel={onCancel}
                onConfirm={submitForm}
                confirmText={
                  isUpdating ? (
                    <TranslatedText
                      stringId="scheduling.newAppointment.action.updateAppointment"
                      fallback="Update appointment"
                      data-testid="translatedtext-7xgo"
                    />
                  ) : (
                    <TranslatedText
                      stringId="scheduling.newAppointment.action.scheduleAppointment"
                      fallback="Schedule appointment"
                      data-testid="translatedtext-6nvi"
                    />
                  )
                }
                data-testid="formsubmitcancelrow-2awu"
              />
            </FormGrid>
          </div>
        </>
      )}
      data-testid="form-77j6"
    />
  );
};
