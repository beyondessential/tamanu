import React, { useState, useEffect, useCallback } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { DeleteOutlined } from '@material-ui/icons';
import { toDateTimeString } from '@tamanu/utils/dateTime';

import { useSuggester } from '../../../api';
import {
  useLocationAssignmentMutation,
  useLocationAssignmentDeleteMutation,
} from '../../../api/mutations';
import { FORM_TYPES, FORM_STATUSES } from '../../../constants';
import { useOverlappingLeavesQuery } from '../../../api/queries/useOverlappingLeavesQuery';
import { useTranslation } from '../../../contexts/Translation';
import { notifyError } from '../../../utils';
import { FormSubmitCancelRow, ButtonRow } from '../../ButtonRow';
import { Button } from '../../Button';
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

const StyledButton = styled(Button)`
  padding: 10px 16px;
  font-size: 12px;
  height: 36px;
  min-height: 36px;
  min-width: 0px;
`;

export const AssignUserDrawer = ({ open, onClose, initialValues }) => {
  const { getTranslation } = useTranslation();
  const isViewing = Boolean(initialValues?.id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Reset edit mode when drawer closes or when switching to a different assignment
  useEffect(() => {
    if (!open || !initialValues?.id) {
      setIsEditMode(false);
    }
  }, [open, initialValues?.id]);

  const userSuggester = useSuggester('practitioner', {
    baseQueryParameters: { filterByFacility: true },
  });

  const { mutateAsync: checkOverlappingLeaves } = useOverlappingLeavesQuery();

  const { mutateAsync: mutateAssignment } = useLocationAssignmentMutation();

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
        startTime: toDateTimeString(startTime).split(' ')[1],
        endTime: toDateTimeString(endTime).split(' ')[1],
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
    await deleteAssignment({ id: initialValues.id, deleteFuture });
    setIsDeleteModalOpen(false);
    onClose();
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const requiredMessage = getTranslation('validation.required.inline', '*Required');

  const checkLeaveOverlap = useCallback(
    async (userId, date, setFieldError, setStatus) => {
      if (!userId || !date || isViewing) {
        setFieldError('date', ''); // Clear error when user or date is empty
        return;
      }

      const response = await checkOverlappingLeaves({
        userId,
        date,
        isRepeating: false,
      });
      if (response?.userLeaves?.length > 0) {
        setFieldError(
          'date',
          <TranslatedText
            stringId="locationAssignment.form.new.error"
            fallback="User has scheduled leave on this date"
          />,
        );
        // Force the form to show errors by setting submit status
        setStatus({ submitStatus: FORM_STATUSES.SUBMIT_ATTEMPTED });
      } else {
        setFieldError('date', ''); // Clear error if no overlapping leaves
      }
    },
    [checkOverlappingLeaves, isViewing],
  );

  const validationSchema = yup.object({
    userId: yup.string().required(requiredMessage),
    locationId: yup.string().required(requiredMessage),
    date: yup
      .string()
      .required(requiredMessage)
      .test('leave-conflict', async function(value) {
        if (!value || !this.parent.userId || isViewing) return true;

        const response = await checkOverlappingLeaves({
          userId: this.parent.userId,
          date: value,
          isRepeating: false,
        });

        if (response?.userLeaves?.length > 0) {
          return this.createError({
            message: (
              <TranslatedText
                stringId="locationAssignment.form.new.error"
                fallback="User has scheduled leave on this date"
              />
            ),
            path: this.path,
          });
        }

        return true;
      }),
    startTime: yup
      .date()
      .nullable()
      .required(requiredMessage),
    endTime: yup
      .date()
      .nullable()
      .required(requiredMessage),
  });

  const renderForm = ({ values, setFieldError, setStatus }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      checkLeaveOverlap(values.userId, values.date, setFieldError, setStatus);
    }, [values.userId, values.date, setFieldError, setStatus]);

    // Clear TimeSlotPicker errors when valid times are selected
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (values.startTime && values.endTime) {
        setFieldError('startTime', '');
        setFieldError('endTime', '');
      }
    }, [values.startTime, values.endTime, setFieldError]);

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          isViewing ? (
            <TranslatedText
              stringId="locationAssignment.form.edit.heading"
              fallback="Location assignment"
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
          isViewing ? (
            <TranslatedText
              stringId="locationAssignment.form.new.description"
              fallback="View, modify or delete this assignment."
              data-testid="translatedtext-p4qw"
            />
          ) : (
            <TranslatedText
              stringId="locationAssignment.form.edit.description"
              fallback="Assign a user to a location using the form below."
              data-testid="translatedtext-o9mp"
            />
          )
        }
        onEdit={isViewing ? () => setIsEditMode(!isEditMode) : undefined}
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
            disabled={isViewing && !isEditMode}
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
            disabled={isViewing && !isEditMode}
            data-testid="field-date"
          />
          <TimeSlotPicker
            date={values.date}
            disabled={(isViewing && !isEditMode) || !values.locationId || !values.date}
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
              <StyledButton
                variant="outlined"
                onClick={handleDeleteClick}
                data-testid="delete-button"
              >
                <DeleteOutlined style={{ marginRight: '4px', fontSize: '16px' }} />
                <TranslatedText
                  stringId="general.action.delete"
                  fallback="Delete"
                  data-testid="translatedtext-delete"
                />
              </StyledButton>
              <StyledButton onClick={onClose} data-testid="close-button">
                <TranslatedText
                  stringId="general.action.close"
                  fallback="Close"
                  data-testid="translatedtext-close"
                />
              </StyledButton>
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
