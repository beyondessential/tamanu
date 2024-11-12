import OvernightIcon from '@material-ui/icons/Brightness2';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { usePatientSuggester, useSuggester } from '../../../api';
import { useLocationBookingMutation } from '../../../api/mutations';
import { Colors } from '../../../constants';
import { notifyError, notifySuccess } from '../../../utils';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { ConfirmModal } from '../../ConfirmModal';
import { Drawer } from '../../Drawer';
import {
  AutocompleteField,
  CheckField,
  DynamicSelectField,
  Field,
  Form,
  LocalisedLocationField,
} from '../../Field';
import { FormGrid } from '../../FormGrid';
import { ClearIcon } from '../../Icons/ClearIcon';
import { TranslatedText } from '../../Translation/TranslatedText';
import { APPOINTMENT_DRAWER_CLASS } from '../AppointmentDetailPopper';
import { DateTimeRangeField } from './DateTimeRangeField/DateTimeRangeField';

const CloseDrawerIcon = styled(ClearIcon)`
  cursor: pointer;
  position: absolute;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
`;

const OvernightStayLabel = styled.span`
  display: flex;
  gap: 0.25rem;
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

const SuccessMessage = ({ isEdit = false }) =>
  isEdit ? (
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
  locationId: yup.string().required('*Required'),
  overnight: yup.boolean().required('*Required'),
  startTime: yup.date().required('*Required'),
  endTime: yup.date().required('*Required'),
  patientId: yup.string().required('*Required'),
  bookingTypeId: yup.string().required('*Required'),
  clinicianId: yup.string(),

  // GUI form values
  date: yup.string().when('overnight', {
    is: false,
    then: yup.string().required('*Required'),
    otherwise: yup.string().nullable(),
  }),

  startDate: yup.string().when('overnight', {
    is: true,
    then: yup.string().required('*Required'),
    otherwise: yup.string().nullable(),
  }),
  endDate: yup.string().when('overnight', {
    is: true,
    then: yup.string().required('*Required'),
    otherwise: yup.string().nullable(),
  }),
});

export const LocationBookingDrawer = ({ open, onClose, initialValues }) => {
  const isEdit = !!initialValues.id;

  const resettableFieldsReversed = ['endTime', 'startTime', 'overnight', 'locationId'];

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
  const { mutateAsync: putOrPostBooking } = useLocationBookingMutation(
    { isEdit },
    {
      onSuccess: () => {
        notifySuccess(<SuccessMessage />);
        onClose();
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

  const renderForm = ({ values, errors, resetForm, setFieldValue, dirty }) => {
    const warnAndResetForm = async () => {
      const confirmed = !dirty || (await handleShowWarningModal());
      if (!confirmed) return;
      onClose();
      resetForm();
    };

    /** Resets fields which appear strictly after the sentinel field in the form. */
    const resetFieldsAfter = sentinel => {
      for (const field of resettableFieldsReversed) {
        if (field === sentinel) return;
        setFieldValue(field, null);
      }
    };

    console.log('----------values and errors-----------')
    console.log(values)
    console.log(errors)

    return (
      <FormGrid columns={1}>
        <CloseDrawerIcon onClick={warnAndResetForm} />
        <Field
          enableLocationStatus={false}
          name="locationId"
          component={LocalisedLocationField}
          required
          onChange={() => resetFieldsAfter('locationId')}
        />
        <Field
          name="overnight"
          label={
            <OvernightStayLabel>
              <TranslatedText stringId="location.overnightStay.label" fallback="Overnight stay" />
              <OvernightIcon aria-hidden htmlColor={Colors.primary} style={{ fontSize: 18 }} />
            </OvernightStayLabel>
          }
          component={CheckField}
          onChange={() => resetFieldsAfter('overnight')}
        />
        <DateTimeRangeField required separate={values.overnight} />
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
        <FormSubmitCancelRow onCancel={warnAndResetForm} />
      </FormGrid>
    );
  };

  const handleSubmit = async ({
    locationId,
    startTime,
    endTime,
    patientId,
    bookingTypeId,
    clinicianId,
  }) =>
    putOrPostBooking({
      locationId,
      startTime: toDateTimeString(startTime),
      endTime: toDateTimeString(endTime),
      patientId,
      bookingTypeId,
      clinicianId,
    });

  return (
    <Drawer
      PaperProps={{
        // Used to exclude the drawer from click away listener on appointment detail popper
        className: APPOINTMENT_DRAWER_CLASS,
      }}
      open={open}
      onClose={onClose}
      title={
        <TranslatedText stringId="locationBooking.form.new.heading" fallback="Book location" />
      }
      description={
        <TranslatedText
          stringId="locationBooking.form.new.description"
          fallback="Create a new booking by completing the below details and selecting ‘Confirm’"
        />
      }
    >
      <Form
        enableReinitialize
        initialValues={initialValues}
        onSubmit={handleSubmit}
        render={renderForm}
        suppressErrorDialog
        validationSchema={validationSchema}
        validateOnChange
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
      />
    </Drawer>
  );
};
