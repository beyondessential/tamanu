import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import { isAfter, parseISO } from 'date-fns';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { usePatientSuggester, useSuggester } from '../../../api';
import { useAppointmentMutation } from '../../../api/mutations';
import { Colors, FORM_TYPES } from '../../../constants';
import { useTranslation } from '../../../contexts/Translation';
import { notifyError, notifySuccess } from '../../../utils';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { ConfirmModal } from '../../ConfirmModal';
import { Drawer } from '../../Drawer';
import { AutocompleteField, CheckField, DynamicSelectField, Field, Form } from '../../Field';
import { FormGrid } from '../../FormGrid';
import { TranslatedText } from '../../Translation/TranslatedText';
import { DateTimeFieldWithSameDayWarning } from './DateTimeFieldWithSameDayWarning';
import { TimeWithFixedDateField } from './TimeWithFixedDateField';

const IconLabel = styled.div`
  display: flex;
  align-items: center;
`;

const formStyles = {
  overflowY: 'auto',
  minWidth: 'fit-content',
};

const getDescription = (isEdit, isLockedPatient) => {
  if (isEdit) {
    return (
      <TranslatedText
        stringId="outpatientAppointment.form.edit.description"
        fallback="Modify the selected appointment below"
      />
    );
  }

  if (isLockedPatient) {
    return (
      <TranslatedText
        stringId="outpatientAppointment.form.newForPatient.description"
        fallback="Complete appointment details below to create a new appointment for the selected patient."
      />
    );
  }

  return (
    <TranslatedText
      stringId="outpatientAppointment.form.new.description"
      fallback="Select a patient from the below list and add relevant appointment details to create a new appointment"
    />
  );
};

const WarningModal = ({ open, setShowWarningModal, resolveFn, isEdit }) => {
  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };
  return (
    <ConfirmModal
      title={
        isEdit ? (
          <TranslatedText
            stringId="outpatientAppointments.cancelWarningModal.edit.title"
            fallback="Cancel modifying appointment"
          />
        ) : (
          <TranslatedText
            stringId="outpatientAppointments.cancelWarningModal.create.title"
            fallback="Cancel new appointment"
          />
        )
      }
      subText={
        isEdit ? (
          <TranslatedText
            stringId="outpatientAppointments.cancelWarningModal.edit.subtext"
            fallback="Are you sure you would like to cancel modifying the appointment?"
          />
        ) : (
          <TranslatedText
            stringId="outpatientAppointments.cancelWarningModal.create.subtext"
            fallback="Are you sure you would like to cancel the new appointment?"
          />
        )
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

const SuccessMessage = ({ isEdit = false }) => {
  return isEdit ? (
    <TranslatedText
      stringId="outpatientAppointment.notification.edit.success"
      fallback="Appointment successfully modified"
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.notification.create.success"
      fallback="Appointment successfully created"
    />
  );
};

const ErrorMessage = ({ isEdit = false, error }) => {
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
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const appointmentTypeSuggester = useSuggester('appointmentType');
  const locationGroupSuggester = useSuggester('bookableLocationGroup');

  const isEdit = !!initialValues.id;
  const isLockedPatient = !!initialValues.patientId;

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
      <Drawer
        open={open}
        onClose={warnAndResetForm}
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
        description={getDescription(isEdit, isLockedPatient)}
      >
        <FormGrid columns={1}>
          <Field
            name="patientId"
            label={<TranslatedText stringId="general.form.patient.label" fallback="Patient" />}
            placeholder={getTranslation(
              'scheduling.filter.placeholder.patientNameOrId',
              'Search patient name or ID',
            )}
            component={AutocompleteField}
            suggester={patientSuggester}
            disabled={isLockedPatient}
            required
          />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.locationGroupId.label"
                fallback="Area"
              />
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
            label={
              <TranslatedText
                stringId="general.localisedField.clinician.label"
                fallback="Clinician"
              />
            }
            component={AutocompleteField}
            suggester={clinicianSuggester}
          />
          <DateTimeFieldWithSameDayWarning isEdit={isEdit} />
          <Field
            name="endTime"
            disabled={!values.startTime}
            date={parseISO(values.startTime)}
            label={<TranslatedText stringId="general.endTime.label" fallback="End time" />}
            component={TimeWithFixedDateField}
            saveDateAsString
          />
          <Field
            name="isHighPriority"
            style={{ width: 'fit-content' }}
            label={
              <IconLabel>
                <TranslatedText stringId="general.highPriority.label" fallback="High priority" />
                <HighPriorityIcon
                  aria-label="High priority"
                  aria-hidden={undefined}
                  htmlColor={Colors.alert}
                  style={{ fontSize: 18 }}
                />
              </IconLabel>
            }
            component={CheckField}
          />

          <FormSubmitCancelRow onCancel={warnAndResetForm} />
        </FormGrid>
      </Drawer>
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
      },
      onError: error => {
        notifyError(<ErrorMessage isEdit={isEdit} error={error} />);
      },
    },
  );
  return (
    <>
      <Form
        onSubmit={async (values, { resetForm }) => {
          await handleSubmit(values);
          resetForm();
        }}
        style={formStyles}
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
        isEdit={isEdit}
      />
    </>
  );
};
