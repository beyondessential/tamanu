import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { toDateTimeString } from '@tamanu/utils/dateTime';

import { useSuggester } from '../../../api';
import { useLocationAssignmentMutation, useLocationAssignmentDeleteMutation } from '../../../api/mutations';
import { FORM_TYPES } from '../../../constants';
import { useTranslation } from '../../../contexts/Translation';
import { notifyError } from '../../../utils';
import { FormSubmitCancelRow, ButtonRow } from '../../ButtonRow';
import { OutlinedButton } from '../../Button';
import { DeleteOutlined } from '@material-ui/icons';
import { Drawer } from '../../Drawer';
import { AutocompleteField, DateField, Field, Form, LocalisedLocationField } from '../../Field';
import { FormGrid } from '../../FormGrid';
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';
import { BOOKING_SLOT_TYPES } from '../../../constants/locationAssignments';
import { TimeSlotPicker } from '../LocationBookingForm/DateTimeRangeField/TimeSlotPicker';
import { TIME_SLOT_PICKER_VARIANTS } from '../LocationBookingForm/DateTimeRangeField/constants';
import { DeleteLocationAssignmentModal } from './DeleteLocationAssignmentModal';

const formStyles = {
  zIndex: 1000,
  position: 'absolute',
  overflowY: 'auto',
  insetInlineEnd: 0,
  blockSize: `calc(100% - ${TOP_BAR_HEIGHT + 1}px)`,
  insetBlockStart: `${TOP_BAR_HEIGHT + 1}px`,
};

const StyledFormSubmitCancelRow = styled(FormSubmitCancelRow)`
  button {
    padding: 10px 16px;
    font-size: 12px;
    height: 36px;
    min-height: 36px;
    min-width: 0px;
    &:not(:first-child) {
      margin-left: 8px;
    }
  }
`;

const StyledButtonRow = styled(ButtonRow)`
  justify-content: space-between;
  button {
    padding: 10px 16px;
    font-size: 12px;
    height: 36px;
    min-height: 36px;
    min-width: 0px;
    &:not(:first-child) {
      margin-left: 8px;
    }
  }
`;

const StyledDeleteButton = styled(OutlinedButton)`
  padding: 10px 16px;
  font-size: 12px;
  height: 36px;
  min-height: 36px;
  min-width: 0px;
`;

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
  const isViewing = Boolean(initialValues?.id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const userSuggester = useSuggester('practitioner', {
    baseQueryParameters: { filterByFacility: true },
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

  const { mutateAsync: deleteAssignment } = useLocationAssignmentDeleteMutation({
    onError: error => {
      notifyError(
        <TranslatedText
          stringId="locationAssignment.notification.delete.error"
          fallback="Failed to delete assignment"
          replacements={{ error: error.message }}
          data-testid="translatedtext-delete-error"
        />,
      );
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

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async ({ deleteFuture }) => {
    try {
      await deleteAssignment({ id: initialValues.id, deleteFuture });
      setIsDeleteModalOpen(false);
      onClose();
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
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

  const renderForm = ({ values }) => {
    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <TranslatedText
            stringId={initialValues.id ? "locationAssignment.form.edit.heading" : "locationAssignment.form.new.heading"}
            fallback={initialValues.id ? "Edit assignment" : "Assign user"}
            data-testid="translatedtext-nugq"
          />
        }
        description={
          <TranslatedText
            stringId={initialValues.id ? "locationAssignment.form.edit.description" : "locationAssignment.form.new.description"}
            fallback={initialValues.id ? "Edit the assignment details below." : "Assign a user to a location using the form below."}
            data-testid="translatedtext-p4qw"
          />
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
            disabled={isViewing}
            data-testid="field-uglc"
          />
          <Field
            enableLocationStatus={false}
            name="locationId"
            component={LocalisedLocationField}
            required
            locationGroupSuggesterType="bookableLocationGroup"
            disabled={isViewing}
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
            disabled={isViewing}
            data-testid="field-date"
          />
          <TimeSlotPicker
            date={values.date}
            disabled={isViewing || !values.locationId || !values.date}
            label={
              <TranslatedText
                stringId="locationAssignment.form.allocatedTime.label"
                fallback="Allocated time"
                data-testid="translatedtext-assignment-time"
              />
            }
            required
            type={BOOKING_SLOT_TYPES.ASSIGNMENTS}
            variant={TIME_SLOT_PICKER_VARIANTS.RANGE}
            data-testid="timeslotpicker-assignment"
          />
          {isViewing ? (
            <StyledButtonRow>
              <StyledDeleteButton 
                onClick={handleDeleteClick}
                data-testid="delete-button"
              >
                <DeleteOutlined style={{ marginRight: '4px', fontSize: '16px' }} />
                <TranslatedText
                  stringId="general.action.delete"
                  fallback="Delete"
                  data-testid="translatedtext-delete"
                />
              </StyledDeleteButton>
              <StyledDeleteButton 
                onClick={onClose}
                data-testid="close-button"
              >
                <TranslatedText
                  stringId="general.action.close"
                  fallback="Close"
                  data-testid="translatedtext-close"
                />
              </StyledDeleteButton>
            </StyledButtonRow>
          ) : (
            <StyledFormSubmitCancelRow 
              onCancel={onClose}
              confirmText={
                <TranslatedText
                  stringId="general.action.saveChanges"
                  fallback="Save changes"
                  data-testid="translatedtext-saveChanges"
                />
              }
              data-testid="formsubmitcancelrow-bj5z" 
            />
          )}
        </FormGrid>
      </Drawer>
    );
  };

  return (
    <>
      <Form
        enableReinitialize
        initialValues={initialValues}
        formType={FORM_TYPES.CREATE_FORM}
        onSubmit={handleSubmit}
        render={renderForm}
        suppressErrorDialog
        validationSchema={validationSchema}
        style={formStyles}
        data-testid="form-rwgy"
      />
      <DeleteLocationAssignmentModal
        open={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        assignment={initialValues}
        data-testid="delete-assignment-modal"
      />
    </>
  );
};
