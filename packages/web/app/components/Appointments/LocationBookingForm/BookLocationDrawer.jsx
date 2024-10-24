import React, { useState } from 'react';
import OvernightIcon from '@material-ui/icons/Brightness2';
import * as yup from 'yup';
import styled, { css, keyframes } from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';

import {
  AutocompleteField,
  CheckField,
  DateField,
  DynamicSelectField,
  Field,
  Form,
  LocalisedLocationField,
} from '../../Field';
import { BodyText, Heading4 } from '../../Typography';
import { BookingTimeField } from './BookingTimeField';
import { useApi, usePatientSuggester, useSuggester } from '../../../api';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { Colors } from '../../../constants';
import { FormGrid } from '../../FormGrid';
import { ClearIcon } from '../../Icons/ClearIcon';
import { ConfirmModal } from '../../ConfirmModal';
import { notifyError, notifySuccess } from '../../../utils';
import { TranslatedText } from '../../Translation/TranslatedText';
import { useAppointmentsQuery } from '../../../api/queries';

const slideIn = keyframes`
  from {
    transform: translateX(100%); // Start off-screen to the right
  }
  to {
    transform: translateX(0); // End at its final position
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0); // Start at its final position
  }
  to {
    transform: translateX(100%); // End off-screen to the right
  }
`;

const Container = styled.div`
  z-index: 9;
  width: 330px;
  padding: 16px;
  background-color: ${Colors.background};
  border: 1px solid ${Colors.outline};
  height: 100%;
  position: absolute;
  right: 0;
  overflow-y: auto;
  animation: ${({ $open }) =>
    $open
      ? css`
          ${slideIn} 0.3s ease-out
        `
      : css`
          ${slideOut} 0.3s ease-out forwards
        `};
`;

const Heading = styled(Heading4)`
  font-size: 16px;
  margin-bottom: 9px;
`;

const Description = styled(BodyText)`
  font-size: 11px;
  color: ${Colors.midText};
`;

const OvernightStayLabel = styled.span`
  display: flex;
  gap: 0.25rem;
`;

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  top: 16px;
  right: 16px;
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
          stringId="locationBooking.cancelWarningModal.title"
          fallback="Cancel new booking"
        />
      }
      subText={
        <TranslatedText
          stringId="locationBooking.cancelWarningModal.subtext"
          fallback="Are you sure you would like to cancel the new booking?"
        />
      }
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText={
        <TranslatedText
          stringId="locationBooking.cancelWarningModal.cancelButton"
          fallback="Back to editing"
        />
      }
      onCancel={() => {
        handleClose(false);
      }}
    />
  );
};

export const BookLocationDrawer = ({ open, closeDrawer, initialBookingValues, editMode }) => {
  const queryClient = useQueryClient();
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const bookingTypeSuggester = useSuggester('bookingType');

  const api = useApi();

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const handleSubmit = async (values, { resetForm }) => {
    const response = editMode
      ? await api.put(`appointments/locationBooking/${values.id}`, values)
      : await api.post(`appointments/locationBooking`, values);

    if (response.status === 409) {
      notifyError(
        <TranslatedText
          stringId="locationBooking.notification.bookingTimeConflict"
          fallback="Booking failed. Booking time no longer available"
        />,
      );
    }

    if (!editMode && response.newRecord?.id) {
      notifySuccess(
        <TranslatedText
          stringId="locationBooking.notification.bookingSuccessfullyCreated"
          fallback="Booking successfully created"
        />,
      );
    }

    if (editMode && response.updatedRecord?.id) {
      notifySuccess(
        <TranslatedText
          stringId="locationBooking.notification.bookingSuccessfullyEdited"
          fallback="Booking successfully edited"
        />,
      );
    }

    closeDrawer();
    resetForm();
    queryClient.invalidateQueries('appointments');
  };

  const headingText = editMode ? 'Modify booking' : 'Book location';
  const descriptionText = editMode
    ? 'Modify the selected booking below.'
    : 'Create a new booking by completing the below details and selecting ‘Confirm’.';

  return (
    <Container columns={1} $open={open}>
      <Heading>{headingText}</Heading>
      <Description>{descriptionText}</Description>
      <Form
        onSubmit={handleSubmit}
        suppressErrorDialog
        validationSchema={yup.object().shape({
          locationId: yup.string().required(),
          startTime: yup.string().required(),
          endTime: yup.string().required(),
          patientId: yup.string().required(),
          bookingTypeId: yup.string().required(),
        })}
        initialValues={initialBookingValues}
        enableReinitialize
        render={({ values, resetForm, setFieldValue, dirty }) => {
          const warnAndResetForm = async () => {
            const confirmed = !dirty || (await handleShowWarningModal());
            if (!confirmed) return;
            closeDrawer();
            resetForm();
          };

          // TODO: how to get this working properly :thinking:
          const showSameDayBookingWarning =
            !editMode &&
            values.patientId &&
            existingLocationBookings.data.find(booking => booking.patientId === values.patientId);

          return (
            <FormGrid columns={1}>
              <CloseDrawerIcon onClick={warnAndResetForm} />
              <Field
                enableLocationStatus={false}
                name="locationId"
                component={LocalisedLocationField}
                required
                onChange={() => {
                  setFieldValue('overnight', null);
                  setFieldValue('date', null);
                  setFieldValue('startTime', null);
                  setFieldValue('endTime', null);
                }}
              />
              <Field
                name="overnight"
                label={
                  <OvernightStayLabel>
                    Overnight stay{' '}
                    <OvernightIcon aria-hidden htmlColor="#326699" style={{ fontSize: 18 }} />
                  </OvernightStayLabel>
                }
                component={styled(CheckField)`
                  align-content: center;
                `}
                disabled={!values.locationId}
              />
              <Field
                name="date"
                label={<TranslatedText stringId="general.form.date.label" fallback="Date" />}
                component={DateField}
                disabled={!values.locationId}
                required
                helperText={
                  showSameDayBookingWarning &&
                  'Patient already has appointment scheduled at this location for this day'
                }
              />
              <BookingTimeField key={values.date} editMode={editMode} disabled={!values.date} />
              <Field
                name="patientId"
                label={<TranslatedText stringId="general.form.patient.label" fallback="Patient" />}
                component={AutocompleteField}
                suggester={patientSuggester}
                required
              />
              <Field
                name="bookingTypeId"
                label={
                  <TranslatedText
                    stringId="location.form.bookingType.label"
                    fallback="Booking type"
                  />
                }
                component={DynamicSelectField}
                suggester={bookingTypeSuggester}
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
              <FormSubmitCancelRow
                onCancel={warnAndResetForm}
                confirmDisabled={!dirty || !values.startTime}
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
  );
};
