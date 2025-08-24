import React, { useState } from 'react';
import * as yup from 'yup';

import { toDateTimeString } from '@tamanu/utils/dateTime';

import { useSuggester } from '../../../api';
import { useLocationAssignmentMutation } from '../../../api/mutations';
import { FORM_TYPES } from '../../../constants';
import { useLocationAssignmentsContext } from '../../../contexts/LocationAssignments';
import { useTranslation } from '../../../contexts/Translation';
import { notifyError } from '../../../utils';
import { FormSubmitCancelRow } from '../../ButtonRow';
import { ConfirmModal } from '../../ConfirmModal';
import { Drawer } from '../../Drawer';
import { AutocompleteField, DateField, Field, Form, LocalisedLocationField } from '../../Field';
import { FormGrid } from '../../FormGrid';
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';
import { BOOKING_SLOT_TYPES } from '../../../constants/locationAssignments';
import { TimeSlotPicker } from '../LocationBookingForm/DateTimeRangeField/TimeSlotPicker';
import { TIME_SLOT_PICKER_VARIANTS } from '../LocationBookingForm/DateTimeRangeField/constants';

const formStyles = {
  zIndex: 1000,
  position: 'absolute',
  overflowY: 'auto',
  insetInlineEnd: 0,
  blockSize: `calc(100% - ${TOP_BAR_HEIGHT + 1}px)`,
  insetBlockStart: `${TOP_BAR_HEIGHT + 1}px`,
};

const WarningModal = ({ open, setShowWarningModal, resolveFn }) => {
  const handleClose = confirmed => {
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

const ErrorMessage = ({ error }) => {
  return (
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
  const isEdit = !!initialValues.id;

  const userSuggester = useSuggester('practitioner', {
    baseQueryParameters: { filterByFacility: true },
  });

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve);
      setShowWarningModal(true);
    });

  const { mutateAsync: mutateAssignment } = useLocationAssignmentMutation({
    onError: error => {
      if (error.response?.data?.error?.type === 'overlap_assignment_error') {
        notifyError(
          <TranslatedText
            stringId="locationAssignment.notification.assignmentTimeConflict"
            fallback="Assignment failed. Time slot conflicts with existing assignment"
            data-testid="translatedtext-xfb0"
          />,
        );
      } else {
        notifyError(<ErrorMessage error={error} data-testid="errormessage-3jmy" />);
      }
    },
  });

  const handleSubmit = async ({ userId, locationId, date, startTime, endTime }, { resetForm }) => {
    mutateAssignment(
      {
        id: initialValues.id,
        userId,
        locationId,
        date,
        startTime: toDateTimeString(startTime),
        endTime: toDateTimeString(endTime),
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
    locationId: yup.string().required(requiredMessage),
    date: yup.string().required(requiredMessage),
    startTime: yup
      .date()
      .nullable()
      .required(requiredMessage),
    endTime: yup
      .date()
      .nullable()
      .required(requiredMessage),
  });

  const renderForm = ({ values, resetForm, dirty }) => {
    const warnAndResetForm = async () => {
      const requiresWarning = dirty && isEdit;
      const confirmed = !requiresWarning || (await handleShowWarningModal());
      if (!confirmed) return;
      onClose();
      resetForm();
      updateSelectedCell({ locationId: null, date: null });
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
            disabled={isEdit}
            required
            locationGroupSuggesterType="bookableLocationGroup"
            data-testid="field-lmrx"
            showAllLocations
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
            required
            saveDateAsString
            data-testid="field-date"
          />
          <TimeSlotPicker
            date={values.date}
            disabled={!values.locationId || !values.date}
            label={
              <TranslatedText
                stringId="locationAssignment.form.assignmentTime.label"
                fallback="Assignment time"
                data-testid="translatedtext-assignment-time"
              />
            }
            required
            type={BOOKING_SLOT_TYPES.ASSIGNMENTS}
            variant={TIME_SLOT_PICKER_VARIANTS.RANGE}
            data-testid="timeslotpicker-assignment"
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
