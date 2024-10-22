import React, { useEffect, useState } from 'react';
import OvernightIcon from '@material-ui/icons/Brightness2';
import * as yup from 'yup';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  Form,
  LocationField,
  TranslatedSelectField,
} from '../../Field';
import styled, { css, keyframes } from 'styled-components';
import { BodyText, Heading4 } from '../../Typography';
import { BookingTimeField } from './BookingTimeField';
import { useApi, usePatientSuggester, useSuggester } from '../../../api';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { Colors } from '../../../constants';
import { FormGrid } from '../../FormGrid';
import { APPOINTMENT_TYPE_LABELS } from '@tamanu/constants';
import { ClearIcon } from '../../Icons/ClearIcon';
import { ConfirmModal } from '../../ConfirmModal';
import { notifyError, notifySuccess } from '../../../utils';
import { useAppointments } from '../../../api/queries/useAppointments';

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
  // TODO: temoirary
  z-index: 100;
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
      title="Cancel new booking"
      subText="Are you sure you would like to cancel the new booking?"
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText="Back to editing"
      onCancel={() => {
        handleClose(false);
      }}
    />
  );
};

export const BookLocationDrawer = ({ open, closeDrawer, editMode = false, initialLocationValues, refreshCalendar }) => {
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const bookingTypeSuggester = useSuggester('bookingType')

  const api = useApi();

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  // TODO: check for existing booking for that patient on this day

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const handleSubmit = async (values, { resetForm }) => {
    if (editMode) {
      await api.put(`appointments/locationBooking/${values.bookingId}`, values, {
        showUnknownErrorToast: true,
      });
    } else {
      await api.post(`appointments/locationBooking`, values, {
        showUnknownErrorToast: true,
      });
    }
    notifySuccess(editMode ? 'Booking successfully edited' : 'Booking successfully created');
    closeDrawer();
    resetForm();
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
        })}
        initialValues={initialLocationValues}
        enableReinitialize
        render={({ values, resetForm, setFieldValue, dirty, initialValues }) => {
          const warnAndResetForm = async () => {
            const confirmed = !dirty || (await handleShowWarningModal());
            if (!confirmed) return;
            closeDrawer();
            resetForm();
          };

          return (
            <FormGrid columns={1}>
              <CloseDrawerIcon onClick={warnAndResetForm} />
              {/* TODO: alther location field to properly handle state */}
              <Field
                enableLocationStatus={false}
                locationGroupLabel="Area"
                label="Location"
                name="locationId"
                component={LocationField}
                value={values.locationId}
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
                label="Date"
                component={DateField}
                disabled={!values.locationId}
                required
              />
              <BookingTimeField disabled={!values.date} />
              <Field
                name="patientId"
                label="Patient"
                component={AutocompleteField}
                suggester={patientSuggester}
                required
              />
              <Field
                name="bookingTypeId"
                label="Booking Type"
                component={AutocompleteField}
                suggester={bookingTypeSuggester}
                required
              />
              <Field
                name="clinicianId"
                label="Clinician"
                component={AutocompleteField}
                suggester={clinicianSuggester}
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
  );
};
