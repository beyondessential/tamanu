import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { toDateString } from '@tamanu/utils/dateTime';

import { useSuggester } from '../../../api';
import { useLocationAssignmentMutation } from '../../../api/mutations';
import { Colors, FORM_TYPES } from '../../../constants';
import { useLocationAssignmentsContext } from '../../../contexts/LocationAssignments';
import { useTranslation } from '../../../contexts/Translation';
import { useSettings } from '../../../contexts/Settings';
import { useBookingSlots } from '../../../hooks/useBookingSlots';
import { notifyError, notifySuccess } from '../../../utils';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { ConfirmModal } from '../../ConfirmModal';
import { Drawer } from '../../Drawer';
import {
  AutocompleteField,
  DateField,
  DynamicSelectField,
  Field,
  Form,
  LocalisedLocationField,
  SelectField,
} from '../../Field';
import { FormGrid } from '../../FormGrid';
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';

const formStyles = {
  zIndex: 1000,
  position: 'absolute',
  overflowY: 'auto',
  insetInlineEnd: 0,
  blockSize: `calc(100% - ${TOP_BAR_HEIGHT + 1}px)`,
  insetBlockStart: `${TOP_BAR_HEIGHT + 1}px`,
};

const WarningModal = ({ open, setShowWarningModal, resolveFn }) => {
  const handleClose = (confirmed) => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };
  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="locationAssignment.cancelWarningModal.title"
          fallback="Cancel assignment modification"
          data-testid="translatedtext-wlb9"
        />
      }
      subText={
        <TranslatedText
          stringId="locationAssignment.cancelWarningModal.subtext"
          fallback="Are you sure you would like to cancel modifying the assignment?"
          data-testid="translatedtext-u1o4"
        />
      }
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText={
        <TranslatedText
          stringId="locationAssignment.cancelWarningModal.cancelButton"
          fallback="Back to editing"
          data-testid="translatedtext-loz1"
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="locationAssignment.cancelWarningModal.cancelModification"
          fallback="Cancel modification"
          data-testid="translatedtext-jg0h"
        />
      }
      onCancel={() => {
        handleClose(false);
      }}
      data-testid="confirmmodal-jx4v"
    />
  );
};

const SuccessMessage = ({ isEdit = false }) =>
  isEdit ? (
    <TranslatedText
      stringId="locationAssignment.notification.assignmentSuccessfullyModified"
      fallback="Assignment successfully modified"
      data-testid="translatedtext-z8jo"
    />
  ) : (
    <TranslatedText
      stringId="locationAssignment.notification.assignmentSuccessfullyCreated"
      fallback="Assignment successfully created"
      data-testid="translatedtext-icwl"
    />
  );

const ErrorMessage = ({ isEdit = false, error }) => {
  return isEdit ? (
    <TranslatedText
      stringId="locationAssignment.notification.edit.error"
      fallback="Failed to edit assignment with error: :error"
      replacements={{ error: error.message }}
      data-testid="translatedtext-85ei"
    />
  ) : (
    <TranslatedText
      stringId="locationAssignment.notification.create.error"
      fallback="Failed to create assignment with error: :error"
      replacements={{ error: error.message }}
      data-testid="translatedtext-0s83"
    />
  );
};

export const AssignUserDrawer = ({ open, onClose, initialValues }) => {
  const { getTranslation } = useTranslation();
  const { updateSelectedCell } = useLocationAssignmentsContext();
  const { getSetting } = useSettings();
  const isEdit = !!initialValues.id;

  const userSuggester = useSuggester('practitioner', {
    baseQueryParameters: { filterByFacility: true },
  });

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialValues.date);

  // Get facility booking settings for time slots
  const bookingSlotSettings = getSetting('appointments.bookingSlots');
  const { slots: timeSlots } = useBookingSlots(selectedDate ? new Date(selectedDate) : null);

  const handleShowWarningModal = async () =>
    new Promise((resolve) => {
      setResolveFn(() => resolve);
      setShowWarningModal(true);
    });

  const { mutateAsync: mutateAssignment } = useLocationAssignmentMutation(
    {
      onError: (error) => {
        if (error.response?.data?.error?.type === 'overlap_assignment_error') {
          notifyError(
            <TranslatedText
              stringId="locationAssignment.notification.assignmentTimeConflict"
              fallback="Assignment failed. Time slot conflicts with existing assignment"
              data-testid="translatedtext-xfb0"
            />,
          );
        } else {
          notifyError(
            <ErrorMessage isEdit={isEdit} error={error} data-testid="errormessage-3jmy" />,
          );
        }
      },
    },
  );

  const handleSubmit = async (
    { userId, locationGroupId, locationId, date, startTime, endTime },
    { resetForm },
  ) => {
    mutateAssignment(
      {
        id: initialValues.id,
        userId,
        locationId,
        date,
        startTime,
        endTime,
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
    userId: yup.string().required(requiredMessage),
    locationGroupId: yup.string().required(requiredMessage),
    locationId: yup.string().required(requiredMessage),
    date: yup.string().required(requiredMessage),
    startTime: yup.string().required(requiredMessage),
    endTime: yup.string().required(requiredMessage),
  });

  // Generate time slot options based on facility settings
  const getTimeSlotOptions = () => {
    if (!timeSlots || !bookingSlotSettings) {
      // Default time slots if no settings
      const defaultSlots = [];
      for (let hour = 8; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          defaultSlots.push({ value: time, label: time });
        }
      }
      return defaultSlots;
    }

    return timeSlots.map((slot) => {
      const startTime = slot.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return {
        value: startTime,
        label: startTime,
      };
    });
  };

  const timeSlotOptions = getTimeSlotOptions();

  const renderForm = ({ values, resetForm, setFieldValue, dirty, errors }) => {
    const warnAndResetForm = async () => {
      const requiresWarning = dirty && isEdit;
      const confirmed = !requiresWarning || (await handleShowWarningModal());
      if (!confirmed) return;
      onClose();
      resetForm();
      updateSelectedCell({ locationId: null, date: null });
    };

    const resetFields = (fields) => {
      for (const field of fields) void setFieldValue(field, null);
    };

    return (
      <Drawer
        open={open}
        onClose={warnAndResetForm}
        title={
          isEdit ? (
            <TranslatedText
              stringId="locationAssignment.form.edit.heading"
              fallback="Modify assignment"
              data-testid="translatedtext-gykj"
            />
          ) : (
            <TranslatedText
              stringId="locationAssignment.form.new.heading"
              fallback="Assign user"
              data-testid="translatedtext-nugq"
            />
          )
        }
        description={
          isEdit ? (
            <TranslatedText
              stringId="locationAssignment.form.edit.description"
              fallback="Modify the selected assignment below."
              data-testid="translatedtext-o9mp"
            />
          ) : (
            <TranslatedText
              stringId="locationAssignment.form.new.description"
              fallback="Create a new assignment by completing the below details and selecting 'Confirm'."
              data-testid="translatedtext-p4qw"
            />
          )
        }
        data-testid="drawer-au2a"
      >
        <FormGrid nested columns={1} data-testid="formgrid-71fd">
          <Field
            name="userId"
            label={
              <TranslatedText
                stringId="general.form.user.label"
                fallback="User"
                data-testid="translatedtext-mym5"
              />
            }
            component={AutocompleteField}
            placeholder={getTranslation(
              'general.user.search.placeholder',
              'Search user name or ID',
            )}
            required
            suggester={userSuggester}
            data-testid="field-uglc"
          />
          <Field
            enableLocationStatus={false}
            name="locationId"
            component={LocalisedLocationField}
            required
            onChange={(e) => {
              updateSelectedCell({ locationId: e.target.value });
              resetFields(['startTime', 'endTime']);
            }}
            error={errors.locationId}
            locationGroupSuggesterType="bookableLocationGroup"
            onLocationGroupChange={(locationGroupId) => {
              setFieldValue('locationGroupId', locationGroupId);
            }}
            data-testid="field-lmrx"
          />
          <Field
            name="date"
            label={
              <TranslatedText
                stringId="general.form.date.label"
                fallback="Date"
                data-testid="translatedtext-date"
              />
            }
            component={DateField}
            type="date"
            required
            onChange={(e) => {
              const newDate = e.target.value;
              setSelectedDate(newDate);
              setFieldValue('date', newDate);
              resetFields(['startTime', 'endTime']);
            }}
            data-testid="field-date"
          />
          <Field
            name="startTime"
            label={
              <TranslatedText
                stringId="locationAssignment.form.startTime.label"
                fallback="Start time"
                data-testid="translatedtext-start-time"
              />
            }
            component={SelectField}
            options={timeSlotOptions}
            required
            onChange={(e) => {
              const selectedStartTime = e.target.value;
              setFieldValue('startTime', selectedStartTime);
              
              // Auto-calculate end time based on slot duration or default to 1 hour later
              const startIndex = timeSlotOptions.findIndex(slot => slot.value === selectedStartTime);
              if (startIndex >= 0 && startIndex < timeSlotOptions.length - 1) {
                setFieldValue('endTime', timeSlotOptions[startIndex + 1].value);
              }
            }}
            data-testid="field-start-time"
          />
          <Field
            name="endTime"
            label={
              <TranslatedText
                stringId="locationAssignment.form.endTime.label"
                fallback="End time"
                data-testid="translatedtext-end-time"
              />
            }
            component={SelectField}
            options={timeSlotOptions}
            required
            data-testid="field-end-time"
          />
          <FormSubmitCancelRow onCancel={warnAndResetForm} data-testid="formsubmitcancelrow-bj5z" />
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
        data-testid="form-rwgy"
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
        data-testid="warningmodal-v53z"
      />
    </>
  );
};