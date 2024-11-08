import { Drawer } from '@material-ui/core';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';


import { usePatientSuggester, useSuggester } from '../../../api';
import { useLocationBookingMutation } from '../../../api/mutations';
import { Colors } from '../../../constants';
import { notifyError, notifySuccess } from '../../../utils';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { ConfirmModal } from '../../ConfirmModal';
import {
  AutocompleteField,
  CheckField,
  DateField,
  DynamicSelectField,
  Field,
  Form,
  LocalisedLocationField,
} from '../../Field';
import { FormGrid } from '../../FormGrid';
import { ClearIcon } from '../../Icons/ClearIcon';
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';
import { BookLocationHeader } from './BookLocationHeader';
import { BookingTimeField } from './BookingTimeField';

const Container = styled.div`
  width: 330px;
  padding: 1rem;
  background-color: ${Colors.background};
  overflow-y: auto;
  position: relative;
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
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
`;

const StyledDrawer = styled(Drawer)`x
  .MuiPaper-root {
    block-size: calc(100% - ${TOP_BAR_HEIGHT}px);
    inset-block-start: ${TOP_BAR_HEIGHT}px;
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

const SuccessMessage = ({ editMode }) =>
  editMode ? (
    <TranslatedText
      stringId="locationBooking.notification.bookingSuccessfullyEdited"
      fallback="Booking successfully edited"
    />
  ) : (
    <TranslatedText
      stringId="locationBooking.notification.bookingSuccessfullyCreated"
      fallback="Booking successfully created"
    />
  );

const validationSchema = yup.object({
  locationId: yup.string().required(),
  startTime: yup.string().required(),
  endTime: yup.string().required(),
  patientId: yup.string().required(),
  bookingTypeId: yup.string().required(),
});

export const BookLocationDrawer = ({ open, closeDrawer, initialBookingValues }) => {
  const editMode = !!initialBookingValues.id;

  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const bookingTypeSuggester = useSuggester('bookingType');

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const queryClient = useQueryClient();
  const { mutateAsync: handleSubmit } = useLocationBookingMutation(
    { editMode },
    {
      onSuccess: () => {
        notifySuccess(<SuccessMessage />);
        closeDrawer();
        queryClient.invalidateQueries('appointments');
      },
      onError: error => {
        notifyError(
          error.message == 409 ? (
            <TranslatedText
              stringId="locationBooking.notification.bookingTimeConflict"
              fallback="Booking failed. Booking time no longer available"
            />
          ) : (
            <TranslatedText
              stringId="locationBooking.notification.somethingWentWrong"
              fallback="Something went wrong"
            />
          ),
        );
      },
    },
  );

  const renderForm = ({ values, resetForm, setFieldValue, dirty }) => {
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
          label={<TranslatedText stringId="general.date.label" fallback="Date" />}
          component={DateField}
          required
        />
        <BookingTimeField key={values.date} disabled={!values.date} />
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
            <TranslatedText stringId="location.form.bookingType.label" fallback="Booking type" />
          }
          component={DynamicSelectField}
          suggester={bookingTypeSuggester}
          required
        />
        <Field
          name="clinicianId"
          label={<TranslatedText stringId="general.form.clinician.label" fallback="Clinician" />}
          component={AutocompleteField}
          suggester={clinicianSuggester}
        />
        <FormSubmitCancelRow onCancel={warnAndResetForm} confirmDisabled={!values.startTime} />
      </FormGrid>
    );
  };

  return (
    <StyledDrawer variant="persistent" anchor="right" open={open} onClose={closeDrawer}>
      <Container columns={1}>
        <BookLocationHeader />
        <Form
          onSubmit={async values => handleSubmit(values)}
          suppressErrorDialog
          validationSchema={validationSchema}
          initialValues={initialBookingValues}
          enableReinitialize
          render={renderForm}
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
