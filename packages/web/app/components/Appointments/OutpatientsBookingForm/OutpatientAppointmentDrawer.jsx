import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';

import { AutocompleteField, DynamicSelectField, Field, Form, DateTimeField } from '../../Field';
import { usePatientSuggester, useSuggester } from '../../../api';
import { useAppointmentMutation } from '../../../api/mutations';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { FORM_TYPES } from '../../../constants';
import { FormGrid } from '../../FormGrid';
import { ClearIcon } from '../../Icons/ClearIcon';
import { ConfirmModal } from '../../ConfirmModal';
import { notifyError, notifySuccess } from '../../../utils';
import { TranslatedText } from '../../Translation/TranslatedText';
import { isAfter, parseISO } from 'date-fns';
import { useTranslation } from '../../../contexts/Translation';
import { Drawer } from '../../Drawer';
import { TimeWithFixedDateField } from './TimeWithFixedDateField';

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
`;

export const WarningModal = ({ open, setShowWarningModal, resolveFn }) => {
  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };
  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="outpatientAppointments.cancelWarningModal.title"
          fallback="Cancel new appointment"
        />
      }
      subText={
        <TranslatedText
          stringId="outpatientAppointments.cancelWarningModal.subtext"
          fallback="Are you sure you would like to cancel the new appointment?"
        />
      }
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText={
        <TranslatedText stringId="appointments.action.backToEditing" fallback="Back to editing" />
      }
      onCancel={() => {
        handleClose(false);
      }}
    />
  );
};

const SuccessMessage = ({ isEdit }) => {
  return isEdit ? (
    <TranslatedText
      stringId="outpatientAppointment.notification.edit.success"
      fallback="Appointment successfully edited"
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.notification.create.success"
      fallback="Appointment successfully created"
    />
  );
};

const ErrorMessage = ({ isEdit, error }) => {
  return isEdit ? (
    <TranslatedText
      stringId="outpatientAppointment.notification.edit.error"
      fallback="Failed to edit appointment with error: :error"
      replacements={{ error: error.message }}
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.notification.create.error"
      fallback="Failed to create appointment with error: :error"
      replacements={{ error: error.message }}
    />
  );
};

export const OutpatientAppointmentDrawer = ({ open, onClose, initialValues = {} }) => {
  const { getTranslation } = useTranslation();
  const queryClient = useQueryClient();
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const appointmentTypeSuggester = useSuggester('appointmentType');
  const locationGroupSuggester = useSuggester('locationGroup');

  const isEdit = !!initialValues.id;

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const validationSchema = yup.object().shape({
    locationGroupId: yup
      .string()
      .required(getTranslation('validation.required.inline', '*Required')),
    appointmentTypeId: yup
      .string()
      .required(getTranslation('validation.required.inline', '*Required')),
    startTime: yup.string().required(getTranslation('validation.required.inline', '*Required')),
    endTime: yup
      .string()
      .nullable()
      .test(
        'isAfter',
        getTranslation(
          'outpatientAppointments.endTime.validation.isAfterStartTime',
          'End time must be after start time',
        ),
        (value, { parent }) => {
          if (!value) return true;
          const startTime = parseISO(parent.startTime);
          const endTime = parseISO(value);
          return isAfter(endTime, startTime);
        },
      ),
    patientId: yup.string().required(getTranslation('validation.required.inline', '*Required')),
  });

  const renderForm = ({ values, resetForm, dirty }) => {
    const warnAndResetForm = async () => {
      const confirmed = !dirty || (await handleShowWarningModal());
      if (!confirmed) return;
      onClose();
      resetForm();
    };

    return (
      <FormGrid columns={1}>
        <CloseDrawerIcon onClick={warnAndResetForm} />
        <Field
          name="patientId"
          label={<TranslatedText stringId="general.form.patient.label" fallback="Patient" />}
          component={AutocompleteField}
          suggester={patientSuggester}
          disabled={isEdit}
          required
        />
        <Field
          label={
            <TranslatedText stringId="general.locationGroup.label" fallback="Location group" />
          }
          name="locationGroupId"
          component={AutocompleteField}
          suggester={locationGroupSuggester}
          required
        />
        <Field
          name="appointmentTypeId"
          label={
            <TranslatedText
              stringId="appointment.appointmentType.label"
              fallback="Appointment type"
            />
          }
          component={DynamicSelectField}
          suggester={appointmentTypeSuggester}
          required
        />
        <Field
          name="clinicianId"
          label={<TranslatedText stringId="general.form.clinician.label" fallback="Clinician" />}
          component={AutocompleteField}
          suggester={clinicianSuggester}
        />
        <Field
          name="startTime"
          label={<TranslatedText stringId="general.dateAndTime.label" fallback="Date & time" />}
          component={DateTimeField}
          required
          saveDateAsString
        />
        <Field
          name="endTime"
          disabled={!values.startTime}
          date={parseISO(values.startTime)}
          label={<TranslatedText stringId="general.endTime.label" fallback="End time" />}
          component={TimeWithFixedDateField}
          saveDateAsString
        />

        <FormSubmitCancelRow onCancel={warnAndResetForm} />
      </FormGrid>
    );
  };

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const { mutateAsync: handleSubmit } = useAppointmentMutation(
    { isEdit },
    {
      onSuccess: () => {
        notifySuccess(<SuccessMessage isEdit={isEdit} />);
        onClose();
        queryClient.invalidateQueries('appointments');
      },
      onError: error => {
        notifyError(<ErrorMessage isEdit={isEdit} error={error} />);
      },
    },
  );
  return (
    <Drawer
      className="appointment-drawer"
      open={open}
      onClose={onClose}
      title={
        isEdit ? (
          <TranslatedText
            stringId="outpatientAppointment.form.edit.heading"
            fallback="Modify outpatient appointment"
          />
        ) : (
          <TranslatedText
            stringId="outpatientAppointment.form.new.heading"
            fallback="New outpatient appointment"
          />
        )
      }
      description={
        <TranslatedText
          stringId="outpatientAppointment.form.new.description"
          fallback="Select a patient from the below list and add relevant appointment details to create a new appointment"
        />
      }
    >
      <Form
        onSubmit={async (values, { resetForm }) => {
          await handleSubmit(values);
          resetForm();
        }}
        suppressErrorDialog
        formType={isEdit ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={validationSchema}
        initialValues={initialValues}
        enableReinitialize
        render={renderForm}
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
      />
    </Drawer>
  );
};
