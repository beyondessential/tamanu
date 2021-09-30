import React, { useCallback } from 'react';
import ReactDOMServer from 'react-dom/server';
import cheerio from 'cheerio';
import * as yup from 'yup';

import { FormGrid } from '../FormGrid';
import { Field, Form, AutocompleteField, SelectField, DateTimeField } from '../Field';
import { ConfirmCancelRow } from '../ButtonRow';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { PatientNameDisplay } from '../PatientNameDisplay';

import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';
import { appointmentTypeOptions } from '../../constants';

export default function NewAppointmentForm(props) {
  const { done = () => {} } = props;
  const api = useApi();
  const clinicianSuggester = new Suggester(api, 'practitioner');
  const locationSuggester = new Suggester(api, 'location');
  const patientSuggester = new Suggester(api, 'patient', ({ id, ...patient }) => ({
    label: cheerio
      .load(ReactDOMServer.renderToString(<PatientNameDisplay patient={patient} />))
      .text(),
    value: id,
  }));
  const createAppointment = useCallback(async values => {
    try {
      console.log(values);
      await api.post('appointments', {
        ...values,
      });
      done();
    } catch (e) {
      console.error(e);
    }
  });
  return (
    <Form
      initialValues={{}}
      onSubmit={createAppointment}
      validationSchema={yup.object().shape({
        patientId: yup.string().required('Please select a patient'),
        appointmentType: yup.string().required('Please choose an appointment type'),
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
            />
            <FormSeparatorLine />
            <Field
              label="Appointment Type"
              name="appointmentType"
              component={SelectField}
              options={appointmentTypeOptions}
            />
          </FormGrid>
          <div style={{ marginTop: '1rem' }}>
            <FormGrid>
              <Field label="Start Time" name="startTime" component={DateTimeField} />
              <Field label="End Time" name="endTime" component={DateTimeField} />
              <Field
                label="Clinician"
                name="clinicianId"
                component={AutocompleteField}
                suggester={clinicianSuggester}
              />
              <Field
                label="Location"
                name="locationId"
                component={AutocompleteField}
                suggester={locationSuggester}
              />
              <FormSeparatorLine />
              <ConfirmCancelRow
                onCancel={done}
                onConfirm={submitForm}
                confirmText="Schedule Appointment"
              />
            </FormGrid>
          </div>
        </>
      )}
    />
  );
}
