import OvernightIcon from '@material-ui/icons/Brightness2';
import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { toDateTimeString } from '@tamanu/utils/dateTime';

import { usePatientSuggester, useSuggester } from '../../../api';
import { useLocationBookingMutation } from '../../../api/mutations';
import { Colors, FORM_TYPES } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
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
import { DateTimeRangeField } from './DateTimeRangeField';

const formStyles = {
  zIndex: 1000,
  position: 'absolute',
  overflowY: 'auto',
  insetInlineEnd: 0,
  blockSize: `calc(100% - ${TOP_BAR_HEIGHT + 1}px)`,
  insetBlockStart: `${TOP_BAR_HEIGHT + 1}px`,
};

const OvernightStayLabel = styled.span`
  display: flex;
  gap: 0.25rem;
`;

const WarningModal = ({ open, setShowWarningModal, resolveFn }) => {
  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };
  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="locationBooking.cancelWarningModal.title"
          fallback="Cancel booking modification"
        />
      }
      subText={
        <TranslatedText
          stringId="locationBooking.cancelWarningModal.subtext"
          fallback="Are you sure you would like to cancel modifying the booking?"
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
      confirmButtonText={
        <TranslatedText
          stringId="locationBooking.cancelWarningModal.cancelModification"
          fallback="Cancel modification"
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
      stringId="locationBooking.notification.bookingSuccessfullyModified"
      fallback="Booking successfully modified"
    />
  ) : (
    <TranslatedText
      stringId="locationBooking.notification.bookingSuccessfullyCreated"
      fallback="Booking successfully created"
    />
  );

const ErrorMessage = ({ isEdit = false, error }) => {
  return isEdit ? (
    <TranslatedText
      stringId="locationBooking.notification.edit.error"
      fallback="Failed to edit booking with error: :error"
      replacements={{ error: error.message }}
    />
  ) : (
    <TranslatedText
      stringId="locationBooking.notification.create.error"
      fallback="Failed to create booking with error: :error"
      replacements={{ error: error.message }}
    />
  );
};

export const LocationBookingDrawer = ({ open, onClose, initialValues }) => {
  const { getTranslation } = useTranslation();
  const { updateSelectedCell } = useLocationBookingsContext();
  const isEdit = !!initialValues.id;

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

  const { mutateAsync: mutateBooking } = useLocationBookingMutation(
    { isEdit },
    {
      onSuccess: () => notifySuccess(<SuccessMessage isEdit={isEdit} />),
      onError: error => {
        if (error.message === 409) {
          notifyError(
            <TranslatedText
              stringId="locationBooking.notification.bookingTimeConflict"
              fallback="Booking failed. Booking time no longer available"
            />,
          );
        } else {
          notifyError(<ErrorMessage isEdit={isEdit} error={error} />);
        }
      },
    },
  );

  const handleSubmit = async (
    { locationId, startTime, endTime, patientId, bookingTypeId, clinicianId },
    { resetForm },
  ) => {
    mutateBooking(
      {
        id: initialValues.id, // Undefined when creating new booking
        locationId,
        startTime: toDateTimeString(startTime),
        endTime: toDateTimeString(endTime),
        patientId,
        bookingTypeId,
        clinicianId,
      },
      {
        onSuccess: () => {
          onClose();
          resetForm();
        },
      },
    );
  };

  const requiredMessage = getTranslation('validation.required.inline', '*Required');

  const validationSchema = yup.object({
    locationId: yup.string().required(requiredMessage),
    overnight: yup.boolean(),
    date: yup.string().when('overnight', {
      is: value => !value,
      then: yup
        .string()
        .nullable()
        .required(requiredMessage),
      otherwise: yup.string().nullable(),
    }),
    startDate: yup.string().when('overnight', {
      is: true,
      then: yup
        .string()
        .nullable()
        .required(requiredMessage),
      otherwise: yup.string().nullable(),
    }),
    endDate: yup.string().when('overnight', {
      is: true,
      then: yup
        .string()
        .nullable()
        .required(requiredMessage),
      otherwise: yup.string().nullable(),
    }),
    startTime: yup
      .date()
      .nullable()
      .required(requiredMessage),
    endTime: yup
      .date()
      .nullable()
      .required(requiredMessage),
    patientId: yup.string().required(requiredMessage),
    bookingTypeId: yup.string().required(requiredMessage),
    clinicianId: yup.string(),
  });

  const renderForm = ({ values, resetForm, setFieldValue, dirty, errors }) => {
    const warnAndResetForm = async () => {
      const requiresWarning = dirty && isEdit;
      const confirmed = !requiresWarning || (await handleShowWarningModal());
      if (!confirmed) return;
      onClose();
      resetForm();
      updateSelectedCell({ locationId: null, date: null });
    };

    const resetFields = fields => {
      for (const field of fields) void setFieldValue(field, null);
    };

    return (
      <Drawer
        open={open}
        onClose={warnAndResetForm}
        title={
          isEdit ? (
            <TranslatedText
              stringId="locationBooking.form.edit.heading"
              fallback="Modify booking"
            />
          ) : (
            <TranslatedText stringId="locationBooking.form.new.heading" fallback="Book location" />
          )
        }
        description={
          isEdit ? (
            <TranslatedText
              stringId="locationBooking.form.edit.description"
              fallback="Modify the selected booking below."
            />
          ) : (
            <TranslatedText
              stringId="locationBooking.form.new.description"
              fallback="Create a new booking by completing the below details and selecting ‘Confirm’."
            />
          )
        }
      >
        <FormGrid nested columns={1}>
          <Field
            enableLocationStatus={false}
            name="locationId"
            component={LocalisedLocationField}
            required
            onChange={e => {
              updateSelectedCell({ locationId: e.target.value });
              resetFields(['startTime', 'endDate', 'endTime']);
            }}
            error={errors.locationId}
            locationGroupSuggesterType="bookableLocationGroup"
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
            onChange={() => resetFields(['endDate', 'endTime'])}
          />
          <DateTimeRangeField
            onChangeStartDate={() => resetFields(['startTime'])}
            required
            separate={values.overnight}
          />
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
          <FormSubmitCancelRow onCancel={warnAndResetForm} />
        </FormGrid>
      </Drawer>
    );
  };

  return (
    <>
      <Form
        enableReinitialize
        initialValues={initialValues}
        formType={isEdit ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        onSubmit={handleSubmit}
        render={renderForm}
        suppressErrorDialog
        validationSchema={validationSchema}
        style={formStyles}
        validateOnChange
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
      />
    </>
  );
};
