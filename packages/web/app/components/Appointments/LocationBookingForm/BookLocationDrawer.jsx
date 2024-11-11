import { Drawer } from '@material-ui/core';
import Brightness2Icon from '@material-ui/icons/Brightness2';
import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
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
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';
import { BookLocationHeader } from './BookLocationHeader';
import { BookingTimeField } from './BookingTimeField';
import { useTranslation } from '../../../contexts/Translation';

const Container = styled.div`
  width: 330px;
  padding-block: 0 1rem;
  padding-inline: 1rem;
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

const StyledDrawer = styled(Drawer)`
  .MuiPaper-root {
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
    font-size: 12px;
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
  locationId: yup.string().required('*Required'),
  date: yup.string().required('*Required'),
  startTime: yup.string().required('*Required'),
  endTime: yup.string().required('*Required'),
  patientId: yup.string().required('*Required'),
  bookingTypeId: yup.string().required('*Required'),
});

export const BookLocationDrawer = ({
  open,
  closeDrawer,
  initialBookingValues,
}) => {
  const { getTranslation } = useTranslation();
  const editMode = !!initialBookingValues.id;

  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const bookingTypeSuggester = useSuggester('bookingType');

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const topRef = useRef(null);

  useEffect(() => topRef.current.scrollIntoView(), [open]);

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
      <>
        <div ref={topRef} aria-hidden></div>
        <BookLocationHeader onClose={warnAndResetForm} />
        <StyledFormGrid nested columns={1}>
          <Field
            enableLocationStatus={false}
            name="locationId"
            component={LocalisedLocationField}
            required
            onChange={() => {
              if (values.overnight) {
                setFieldValue('overnight', null);
              }
              if (values.startTime) {
                setFieldValue('startTime', null);
                setFieldValue('endTime', null);
              }
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
          placeholder={getTranslation(
            'general.patient.search.placeholder',
            'Search patient name or ID',
          )}
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
    </>);
  };

  return (
    <StyledDrawer variant="persistent" anchor="right" open={open} onClose={closeDrawer}>
      <Container>
        <Form
          onSubmit={async (values, { resetForm }) => {
            await handleSubmit(values);
            resetForm();
          }}
          suppressErrorDialog
          validationSchema={validationSchema}
          validateOnChange
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
