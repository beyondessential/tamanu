import React, { useCallback } from 'react';
import * as yup from 'yup';
import { APPOINTMENT_STATUSES } from '@tamanu/constants';
import { FormGrid } from '../FormGrid';
import { AutocompleteField, DateTimeField, Field, Form, SelectField } from '../Field';
import { FormSubmitCancelRow } from '../ButtonRow';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { useApi, usePatientSuggester, useSuggester } from '../../api';
import { appointmentTypeOptions } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';
import { TranslatedSelectField } from '../Translation/TranslatedSelectField.jsx';

export const AppointmentForm = props => {
  const { onSuccess = () => {}, onCancel, appointment } = props;
  const api = useApi();
  const isUpdating = !!appointment;
  const clinicianSuggester = useSuggester('practitioner');
  const patientSuggester = usePatientSuggester();
  const locationGroupSuggester = useSuggester('facilityLocationGroup');

  let initialValues = {};
  if (isUpdating) {
    initialValues = {
      patientId: appointment.patientId,
      type: appointment.type,
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
      onSubmit={createAppointment}
      validationSchema={yup.object().shape({
        patientId: yup.string().required('Please select a patient'),
        type: yup.string().required('Please choose an appointment type'),
        startTime: yup.string().required('Please select a start time'),
        clinicianId: yup.string().required('Required'),
        locationGroupId: yup
          .string()
          .required('Please select an area')
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
                  stringId="scheduling.newAppointment.form.type.label"
                  fallback="Appointment type"
                />
              }
              name="type"
              component={TranslatedSelectField}
              options={appointmentTypeOptions}
              required
              prefix="appointment.property.type"
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
                      fallback="'Update appointment'"
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
