import React, { useState, useEffect, useCallback } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';

import { toDateTimeString } from '@tamanu/utils/dateTime';

import { useSuggester } from '../../../api';
import { useLocationAssignmentMutation } from '../../../api/mutations';
import { useOverlappingLeavesQuery } from '../../../api/queries/useOverlappingLeavesQuery';
import { FORM_STATUSES, FORM_TYPES } from '../../../constants';
import { useTranslation } from '../../../contexts/Translation';
import { FormSubmitCancelRow } from '../../ButtonRow';
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

export const AssignUserDrawer = ({ open, onClose, initialValues }) => {
  const { getTranslation } = useTranslation();
  const isViewing = Boolean(initialValues?.id);
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
          <TranslatedText
            stringId="locationAssignment.form.new.heading"
            fallback="Location assignment"
            data-testid="translatedtext-nugq"
          />
        }
        description={
          <TranslatedText
            stringId="locationAssignment.form.new.description"
            fallback="View, modify or delete this assignment."
            data-testid="translatedtext-p4qw"
          />
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
          <StyledFormSubmitCancelRow 
            onCancel={isViewing && !isEditMode ? undefined : isEditMode ? () => setIsEditMode(false) : onClose}
            onConfirm={isViewing && !isEditMode ? onClose : undefined}
            confirmText={isViewing && !isEditMode ? (
              <TranslatedText
                stringId="general.action.close"
                fallback="Close"
                data-testid="translatedtext-close"
              />
            ) : isEditMode ? (
              <TranslatedText
                stringId="general.action.confirm"
                fallback="Confirm"
                data-testid="translatedtext-confirm"
              />
            ) : (
              <TranslatedText
                stringId="general.action.saveChanges"
                fallback="Save changes"
                data-testid="translatedtext-saveChanges"
              />
            )}
            cancelText={isEditMode ? (
              <TranslatedText
                stringId="general.action.cancel"
                fallback="Cancel"
                data-testid="translatedtext-cancel"
              />
            ) : undefined}
            data-testid="formsubmitcancelrow-bj5z" 
          />
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
    </>
  );
};
