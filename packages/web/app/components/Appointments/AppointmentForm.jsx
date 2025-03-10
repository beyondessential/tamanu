import React, { useCallback } from 'react';
import * as yup from 'yup';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import { FormGrid } from '../FormGrid';
import { AutocompleteField, DateTimeField, Field, Form } from '../Field';
import { FormSubmitCancelRow } from '../ButtonRow';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { useApi, usePatientSuggester, useSuggester } from '../../api';
import { FORM_TYPES } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';

export const AppointmentForm = props => {
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
    async values => {
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
          .translatedLabel(<TranslatedText stringId="general.patient.label" fallback="Patient" />),
        appointmentTypeId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="appointment.appointmentType.label"
              fallback="Appointment type"
            />,
          ),
        startTime: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="general.startTime.label" fallback="Start time" />,
          ),
        clinicianId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
            />,
          ),
        locationGroupId: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText stringId="general.area.label" fallback="Area" />)
          .nullable(),
      })}
      render={({ submitForm }) => (
        <>
          <FormGrid columns={1}>
            <Field
              label={<TranslatedText stringId="general.patient.label" fallback="Patient" />}
              name="patientId"
              component={AutocompleteField}
              suggester={patientSuggester}
              required
            />
            <FormSeparatorLine />
            <Field
              label={
                <TranslatedText
                  stringId="appointment.appointmentType.label"
                  fallback="Appointment type"
                />
              }
              name="appointmentTypeId"
              component={AutocompleteField}
              suggester={appointmentTypeSuggester}
              required
            />
          </FormGrid>
          <div style={{ marginTop: '1rem' }}>
            <FormGrid>
              <Field
                label={<TranslatedText stringId="general.startTime.label" fallback="Start time" />}
                name="startTime"
                component={DateTimeField}
                saveDateAsString
                required
              />
              <Field
                label={<TranslatedText stringId="general.endTime.label" fallback="End time" />}
                name="endTime"
                saveDateAsString
                component={DateTimeField}
              />
              <Field
                label={
                  <TranslatedText
                    stringId="general.localisedField.clinician.label.short"
                    fallback="Clinician"
                  />
                }
                name="clinicianId"
                component={AutocompleteField}
                suggester={clinicianSuggester}
                required
              />
              <Field
                label={<TranslatedText stringId="general.area.label" fallback="Area" />}
                name="locationGroupId"
                component={AutocompleteField}
                suggester={locationGroupSuggester}
                required
                autofill
              />
              <FormSeparatorLine />
              <FormSubmitCancelRow
                onCancel={onCancel}
                onConfirm={submitForm}
                confirmText={
                  isUpdating ? (
                    <TranslatedText
                      stringId="scheduling.newAppointment.action.updateAppointment"
                      fallback="Update appointment"
                    />
                  ) : (
                    <TranslatedText
                      stringId="scheduling.newAppointment.action.scheduleAppointment"
                      fallback="Schedule appointment"
                    />
                  )
                }
              />
            </FormGrid>
          </div>
        </>
      )}
    />
  );
};
