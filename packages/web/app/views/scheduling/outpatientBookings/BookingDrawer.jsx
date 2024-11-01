import React, { useState } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  AutocompleteField,
  DynamicSelectField,
  Field,
  Form,
  DateTimeField,
  TimeWithStableDayField,
} from '../../../components/Field';
import { BodyText, Heading4 } from '../../../components/Typography';
import { useApi, usePatientSuggester, useSuggester } from '../../../api';
import { FormSubmitCancelRow } from '../../../components/ButtonRow';
import { Colors } from '../../../constants';
import { FormGrid } from '../../../components/FormGrid';
import { ClearIcon } from '../../../components/Icons/ClearIcon';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { notifyError, notifySuccess } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { Drawer } from '@material-ui/core';
import { TOP_BAR_HEIGHT } from '../../../components/TopBar';
import { isAfter, parseISO } from 'date-fns';
import { useTranslation } from '../../../contexts/Translation';

const Container = styled.div`
  width: 330px;
  padding: 16px;
  background-color: ${Colors.background};
  overflow-y: auto;
  position: relative;
`;

const Heading = styled(Heading4)`
  font-size: 16px;
  margin-bottom: 9px;
`;

const Description = styled(BodyText)`
  font-size: 11px;
  color: ${Colors.midText};
`;

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
`;

const StyledDrawer = styled(Drawer)`
  .MuiPaper-root {
    top: ${TOP_BAR_HEIGHT}px;
    height: calc(100% - ${TOP_BAR_HEIGHT}px);
  }
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

export const BookingDrawer = ({ open, closeDrawer, initialBookingValues }) => {
  const { getTranslation } = useTranslation();
  const queryClient = useQueryClient();
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const appointmentTypeSuggester = useSuggester('appointmentType');
  const locationGroupSuggester = useSuggester('locationGroup');

  const api = useApi();

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const { mutateAsync: handleSubmit } = useMutation(
    payload => {
      return api.post('appointments', payload);
    },
    {
      onSuccess: () => {
        notifySuccess(
          <TranslatedText
            stringId="outpatientAppointment.notification.create.success"
            fallback="Appointment created successfully"
          />,
        );
        closeDrawer();
        queryClient.invalidateQueries('appointments');
      },
      onError: error => {
        notifyError(
          <TranslatedText
            stringId="outpatientAppointments.notification.create.error"
            fallback="Failed to create appointment with error: :error"
            replacements={{ error: error.message }}
          />,
        );
      },
    },
  );

  return (
    <StyledDrawer variant="persistent" anchor="right" open={open} onClose={closeDrawer}>
      <Container columns={1}>
        <Heading>
          <TranslatedText
            stringId="outpatientAppointment.form.new.heading"
            fallback="New outpatient appointment"
          />
        </Heading>
        <Description>
          <TranslatedText
            stringId="outpatientAppointment.form.new.description"
            fallback="Select a patient from the below list and add relevant appointment details to create a new appointment"
          />
        </Description>
        <Form
          onSubmit={async values => handleSubmit(values)}
          suppressErrorDialog
          validationSchema={yup.object().shape({
            locationGroupId: yup
              .string()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="general.localisedField.locationGroupId.label"
                  fallback="Area"
                />,
              ),
            appointmentTypeId: yup.string().required(),
            startTime: yup.string().required(),
            endTime: yup
              .string()
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
            patientId: yup.string().required(),
          })}
          initialValues={initialBookingValues}
          enableReinitialize
          render={({ values, resetForm, dirty }) => {
            const warnAndResetForm = async () => {
              const confirmed = !dirty || (await handleShowWarningModal());
              if (!confirmed) return;
              closeDrawer();
              resetForm();
            };

            return (
              <FormGrid columns={1}>
                <CloseDrawerIcon onClick={warnAndResetForm} />
                <Field
                  name="patientId"
                  label={
                    <TranslatedText stringId="general.form.patient.label" fallback="Patient" />
                  }
                  component={AutocompleteField}
                  suggester={patientSuggester}
                  required
                />
                <Field
                  label={
                    <TranslatedText
                      stringId="general.locationGroup.label"
                      fallback="Location group"
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
                    <TranslatedText stringId="general.form.clinician.label" fallback="Clinician" />
                  }
                  component={AutocompleteField}
                  suggester={clinicianSuggester}
                />
                <Field
                  name="startTime"
                  saveDateAsString
                  label={
                    <TranslatedText stringId="general.dateAndTime.label" fallback="Date & time" />
                  }
                  component={DateTimeField}
                  required
                />
                <Field
                  name="endTime"
                  disabled={!values.startTime}
                  saveDateAsString
                  baseDate={parseISO(values.startTime)}
                  label={<TranslatedText stringId="general.endTime.label" fallback="End time" />}
                  component={TimeWithStableDayField}
                />

                <FormSubmitCancelRow
                  onCancel={warnAndResetForm}
                  confirmDisabled={!values.startTime}
                />
              </FormGrid>
            );
          }}
        />
        <WarningModal
          open={warningModalOpen}
          setShowWarningModal={setShowWarningModal}
          resolveFn={resolveFn}
        />
      </Container>
    </StyledDrawer>
  );
};
