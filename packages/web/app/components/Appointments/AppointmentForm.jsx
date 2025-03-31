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
          .translatedLabel(<TranslatedText
          stringId="general.patient.label"
          fallback="Patient"
          data-test-id='translatedtext-fbvn' />),
        appointmentTypeId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="appointment.appointmentType.label"
              fallback="Appointment type"
              data-test-id='translatedtext-iudy' />,
          ),
        startTime: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.startTime.label"
              fallback="Start time"
              data-test-id='translatedtext-vrac' />,
          ),
        clinicianId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="general.localisedField.clinician.label.short"
              fallback="Clinician"
              data-test-id='translatedtext-d1py' />,
          ),
        locationGroupId: yup
          .string()
          .required()
          .translatedLabel(<TranslatedText
          stringId="general.area.label"
          fallback="Area"
          data-test-id='translatedtext-d65e' />)
          .nullable(),
      })}
      render={({ submitForm }) => (
        <>
          <FormGrid columns={1}>
            <Field
              label={<TranslatedText
                stringId="general.patient.label"
                fallback="Patient"
                data-test-id='translatedtext-icu9' />}
              name="patientId"
              component={AutocompleteField}
              suggester={patientSuggester}
              required
              data-test-id='field-5wi2' />
            <FormSeparatorLine />
            <Field
              label={
                <TranslatedText
                  stringId="appointment.appointmentType.label"
                  fallback="Appointment type"
                  data-test-id='translatedtext-kcgr' />
              }
              name="appointmentTypeId"
              component={AutocompleteField}
              suggester={appointmentTypeSuggester}
              required
              data-test-id='field-mlck' />
          </FormGrid>
          <div style={{ marginTop: '1rem' }}>
            <FormGrid>
              <Field
                label={<TranslatedText
                  stringId="general.startTime.label"
                  fallback="Start time"
                  data-test-id='translatedtext-c6e4' />}
                name="startTime"
                component={DateTimeField}
                saveDateAsString
                required
                data-test-id='field-703y' />
              <Field
                label={<TranslatedText
                  stringId="general.endTime.label"
                  fallback="End time"
                  data-test-id='translatedtext-90lh' />}
                name="endTime"
                saveDateAsString
                component={DateTimeField}
                data-test-id='field-ui4n' />
              <Field
                label={
                  <TranslatedText
                    stringId="general.localisedField.clinician.label.short"
                    fallback="Clinician"
                    data-test-id='translatedtext-bm79' />
                }
                name="clinicianId"
                component={AutocompleteField}
                suggester={clinicianSuggester}
                required
                data-test-id='field-voj9' />
              <Field
                label={<TranslatedText
                  stringId="general.area.label"
                  fallback="Area"
                  data-test-id='translatedtext-wlyu' />}
                name="locationGroupId"
                component={AutocompleteField}
                suggester={locationGroupSuggester}
                required
                autofill
                data-test-id='field-lpyf' />
              <FormSeparatorLine />
              <FormSubmitCancelRow
                onCancel={onCancel}
                onConfirm={submitForm}
                confirmText={
                  isUpdating ? (
                    <TranslatedText
                      stringId="scheduling.newAppointment.action.updateAppointment"
                      fallback="Update appointment"
                      data-test-id='translatedtext-io8r' />
                  ) : (
                    <TranslatedText
                      stringId="scheduling.newAppointment.action.scheduleAppointment"
                      fallback="Schedule appointment"
                      data-test-id='translatedtext-ex57' />
                  )
                }
                data-test-id='formsubmitcancelrow-hpx4' />
            </FormGrid>
          </div>
        </>
      )}
    />
  );
};
