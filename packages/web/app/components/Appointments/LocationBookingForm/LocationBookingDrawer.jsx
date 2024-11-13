import OvernightIcon from '@material-ui/icons/Brightness2';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { usePatientSuggester, useSuggester } from '../../../api';
import { useLocationBookingMutation } from '../../../api/mutations';
import { Colors } from '../../../constants';
import { useTranslation } from '../../../contexts/Translation';
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
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';
import { APPOINTMENT_DRAWER_CLASS } from '../AppointmentDetailPopper';
import { DateTimeRangeField } from './DateTimeRangeField/DateTimeRangeField';

const StyledDrawer = styled(Drawer)`
  .MuiPaper-root {
    // Add 1 pixel to allow border to show
    block-size: calc(100% - ${TOP_BAR_HEIGHT + 1}px);
    inset-block-start: ${TOP_BAR_HEIGHT + 1}px;
  }
`;

// A bit blunt but the base form fields are going to have their size tweaked in a
// later card so this is a bridging solution just for this form
const StyledFormGrid = styled(FormGrid)`
  .label-field,
  .MuiInputBase-input,
  .MuiFormControlLabel-label,
  div {
    font-size: 0.75rem;
  }
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
  date: yup.string().required('*Required'),
  startTime: yup.date().required('*Required'),
  endTime: yup.date().required('*Required'),
  patientId: yup.string().required('*Required'),
  bookingTypeId: yup.string().required('*Required'),
  clinicianId: yup.string(),
});

export const LocationBookingDrawer = ({ open, onClose, initialValues }) => {
  const { getTranslation } = useTranslation();
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

  const renderForm = ({ values, resetForm, setFieldValue, dirty }) => {
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

    return (
      <StyledDrawer
        variant="persistent"
        anchor="right"
        PaperProps={{
          // Used to exclude the drawer from click away listener on appointment detail popper
          className: APPOINTMENT_DRAWER_CLASS,
        }}
        open={open}
        onClose={warnAndResetForm}
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
        <StyledFormGrid nested columns={1}>
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
          <DateTimeRangeField isEdit={isEdit} required separate={values.overnight} />
          <Field
            component={AutocompleteField}
            label={<TranslatedText stringId="general.form.patient.label" fallback="Patient" />}
            name="patientId"
            placeholder={getTranslation(
              'general.patient.search.placeholder',
              'Search patient name or ID',
            )}
            required
            suggester={patientSuggester}
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
        </StyledFormGrid>
      </StyledDrawer>
    );
  };

  const handleSubmit = async (
    { locationId, startTime, endTime, patientId, bookingTypeId, clinicianId },
    { resetForm },
  ) => {
    putOrPostBooking({
      locationId,
      startTime: toDateTimeString(startTime),
      endTime: toDateTimeString(endTime),
      patientId,
      bookingTypeId,
      clinicianId,
    });
    resetForm();
  };

  return (
    <>
      <Form
        enableReinitialize
        initialValues={initialValues}
        onSubmit={handleSubmit}
        render={renderForm}
        suppressErrorDialog
        validationSchema={validationSchema}
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
      />
    </>
  );
};
