import React, { useState } from 'react';
import * as yup from 'yup';
import styled, { css, keyframes } from 'styled-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Brightness2Icon from '@material-ui/icons/Brightness2';

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

const OvernightStayField = styled.div`
  display: flex;
  align-items: center;
`;

const OvernightIcon = styled(Brightness2Icon)`
  position: absolute;
  left: 145px;
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

export const BookLocationDrawer = ({ open, closeDrawer, initialBookingValues }) => {
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

  const { mutateAsync: handleSubmit } = useMutation(
    payload => api.post('appointments/locationBooking', payload, { throwResponse: true }),
    {
      onSuccess: () => {
        notifySuccess(
          <TranslatedText
            stringId="locationBooking.notification.bookingSuccessfullyCreated"
            fallback="Booking successfully created"
          />,
        );
        closeDrawer();
        queryClient.invalidateQueries('appointments');
      },
      onError: error => {
        notifyError(
          // TODO: checking staths code feels wrong
          error.message === '409'
            ? "Booking failed. Booking time no longer available"
            : 'Something went wrong',
        );
      },
    },
  );

  return (
    <Container columns={1} $open={open}>
      <Heading>
        <TranslatedText stringId="locationBooking.form.new.heading" fallback="Book location" />
      </Heading>
      <Description>
        <TranslatedText
          stringId="locationBooking.form.new.description"
          fallback="Create a new booking by completing the below details and selecting ‘Confirm’."
        />
      </Description>
      <Form
        onSubmit={async values => handleSubmit(values)}
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
              <OvernightStayField>
                <Field
                  name="overnight"
                  label={
                    <TranslatedText
                      stringId="location.form.overnightStay.label"
                      fallback="Overnight stay"
                    />
                  }
                  component={CheckField}
                  disabled={!values.locationId}
                />
                <OvernightIcon fontSize="small" />
              </OvernightStayField>
              <Field
                name="date"
                label={<TranslatedText stringId="general.form.date.label" fallback="Date" />}
                component={DateField}
                disabled={!values.locationId}
                required
              />
              <BookingTimeField disabled={!values.date} />
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
