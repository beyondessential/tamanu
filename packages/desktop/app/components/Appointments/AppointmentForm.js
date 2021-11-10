import React, { useCallback } from 'react';
import * as yup from 'yup';

import { FormGrid } from '../FormGrid';
import { Field, Form, AutocompleteField, SelectField, DateTimeField } from '../Field';
import { ConfirmCancelRow } from '../ButtonRow';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { getPatientNameAsString } from '../PatientNameDisplay';

import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';
import { appointmentTypeOptions } from '../../constants';

export const AppointmentForm = props => {
  const { onSuccess = () => {}, onCancel } = props;
  const api = useApi();
  const clinicianSuggester = new Suggester(api, 'practitioner');
  const locationSuggester = new Suggester(api, 'location');
  const patientSuggester = new Suggester(api, 'patient', ({ id, ...patient }) => ({
    label: getPatientNameAsString(patient),
    value: id,
  }));
  const createAppointment = useCallback(async values => {
    await api.post('appointments', {
      ...values,
    });
    onSuccess();
  });
  return (
    <Form
      initialValues={{}}
      onSubmit={createAppointment}
      validationSchema={yup.object().shape({
        patientId: yup.string().required('Please select a patient'),
        type: yup.string().required('Please choose an appointment type'),
        startTime: yup.string().required(),
        clinicianId: yup.string().required('Please select a clinician'),
        locationId: yup.string().required('Please choose a location'),
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
              <Field label="Start time" name="startTime" component={DateTimeField} required />
              <Field label="End time" name="endTime" component={DateTimeField} />
              <Field
                label="Clinician"
                name="clinicianId"
                component={AutocompleteField}
                suggester={clinicianSuggester}
                required
              />
              <Field
                label="Location"
                name="locationId"
                component={AutocompleteField}
                suggester={locationSuggester}
                required
              />
              <FormSeparatorLine />
              <ConfirmCancelRow
                onCancel={onCancel}
                onConfirm={submitForm}
                confirmText="Schedule appointment"
              />
            </FormGrid>
          </div>
        </>
      )}
    />
  );
};
