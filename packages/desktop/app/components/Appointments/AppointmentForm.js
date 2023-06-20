import React, { useCallback } from 'react';
import * as yup from 'yup';
import { APPOINTMENT_STATUSES } from '@tamanu/shared/constants';
import { FormGrid } from '../FormGrid';
import { Field, Form, AutocompleteField, SelectField, DateTimeField } from '../Field';
import { ConfirmCancelRow } from '../ButtonRow';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { useApi, usePatientSuggester, useSuggester } from '../../api';
import { appointmentTypeOptions } from '../../constants';

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
        clinicianId: yup.string().required('Please select a clinician'),
        locationGroupId: yup
          .string()
          .required('Please select an area')
          .nullable(),
      })}
      render={({ submitForm }) => (
        <>
          <FormGrid columns={1}>
            <Field
              label="Patient"
              name="patientId"
              component={AutocompleteField}
              suggester={patientSuggester}
              required
            />
            <FormSeparatorLine />
            <Field
              label="Appointment type"
              name="type"
              component={SelectField}
              options={appointmentTypeOptions}
              required
            />
          </FormGrid>
          <div style={{ marginTop: '1rem' }}>
            <FormGrid>
              <Field
                label="Start time"
                name="startTime"
                component={DateTimeField}
                saveDateAsString
                required
              />
              <Field label="End time" name="endTime" saveDateAsString component={DateTimeField} />
              <Field
                label="Clinician"
                name="clinicianId"
                component={AutocompleteField}
                suggester={clinicianSuggester}
                required
              />
              <Field
                label="Area"
                name="locationGroupId"
                component={AutocompleteField}
                suggester={locationGroupSuggester}
                required
                autofill
              />
              <FormSeparatorLine />
              <ConfirmCancelRow
                onCancel={onCancel}
                onConfirm={submitForm}
                confirmText={isUpdating ? 'Update appointment' : 'Schedule appointment'}
              />
            </FormGrid>
          </div>
        </>
      )}
    />
  );
};
