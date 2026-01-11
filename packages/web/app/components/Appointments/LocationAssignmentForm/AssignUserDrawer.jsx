import React, { useState, useEffect, useCallback } from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { DeleteOutlined } from '@material-ui/icons';
import { toDateString, toDateTimeString } from '@tamanu/utils/dateTime';

import { useSuggester } from '../../../api';
import {
  useLocationAssignmentMutation,
  useLocationAssignmentDeleteMutation,
  useLocationAssignmentOverlappingAssignmentsMutation,
} from '../../../api/mutations';
import { useOverlappingLeavesQuery } from '../../../api/queries/useOverlappingLeavesQuery';
import { useTranslation } from '../../../contexts/Translation';
import { useLocationAssignmentsContext } from '../../../contexts/LocationAssignments';
import { notifyError } from '../../../utils';
import { FormSubmitCancelRow, ButtonRow } from '../../ButtonRow';
import { Button } from '../../Button';
import { Drawer } from '../../Drawer';
import {
  AutocompleteField,
  DateField,
  Field,
  LocalisedLocationField,
  SwitchField,
} from '../../Field';
import { FormGrid, Form } from '@tamanu/ui-components';
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';
import {
  ASSIGNMENT_SCHEDULE_INITIAL_VALUES,
  BOOKING_SLOT_TYPES,
  MODIFY_REPEATING_ASSIGNMENT_MODE,
} from '../../../constants/locationAssignments';
import { TimeSlotPicker } from '../LocationBookingForm/DateTimeRangeField/TimeSlotPicker';
import { TIME_SLOT_PICKER_VARIANTS } from '../LocationBookingForm/DateTimeRangeField/constants';
import { DeleteLocationAssignmentModal } from './DeleteLocationAssignmentModal';
import { RepeatingFields } from '../RepeatingFields';
import { add, format as dateFnsFormat, parseISO } from 'date-fns';
import {
  getLastFrequencyDate,
  getWeekdayOrdinalPosition,
} from '@tamanu/utils/appointmentScheduling';
import { DAYS_OF_WEEK, REPEAT_FREQUENCY, FORM_TYPES, SUBMIT_ATTEMPTED_STATUS } from '@tamanu/constants';
import { isNumber } from 'lodash';
import { toast } from 'react-toastify';
import { useAuth } from '../../../contexts/Auth';
import { useSettings } from '../../../contexts/Settings';
import { ModifyRepeatingAssignmentModal } from './ModifyRepeatingAssignmentModal';
import { OverlappingLeavesModal } from './OverlappingLeavesModal';
import { OverlappingRepeatingAssignmentModal } from './OverlappingRepeatingAssignmentModal';

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

export const AssignUserDrawer = ({ open, onClose, initialValues, facilityId }) => {
  const { getTranslation } = useTranslation();
  const { updateSelectedCell } = useLocationAssignmentsContext();
  const { getSetting } = useSettings();
  const maxFutureMonths = getSetting('locationAssignments.assignmentMaxFutureMonths') || 24;

  const { ability } = useAuth();
  const hasWritePermission = ability?.can?.('write', 'LocationSchedule');
  const hasDeletePermission = ability?.can?.('delete', 'LocationSchedule');

  const isViewing = Boolean(initialValues?.id);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [
    isConfirmModifyRepeatingAssignmentModalOpen,
    setIsConfirmModifyRepeatingAssignmentModalOpen,
  ] = useState(false);
  const [overlappingRepeatingAssignments, setOverlappingRepeatingAssignments] = useState(null);
  const [overlappingLeaves, setOverlappingLeaves] = useState(null);
  const [handleConfirmOverlappingLeaves, setHandleConfirmOverlappingLeaves] = useState(null);
  const [
    selectedModifyRepeatingAssignmentMode,
    setSelectedModifyRepeatingAssignmentMode,
  ] = useState();
  const isEditingSingleRepeatingAssignment =
    isEditMode &&
    initialValues.isRepeatingAssignment &&
    selectedModifyRepeatingAssignmentMode === MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_ASSIGNMENT;
  const isEditingMultipleRepeatingAssignments =
    isEditMode &&
    initialValues.isRepeatingAssignment &&
    selectedModifyRepeatingAssignmentMode ===
      MODIFY_REPEATING_ASSIGNMENT_MODE.THIS_AND_FUTURE_ASSIGNMENTS;
  const hideRepeatingFields =
    (isEditMode || isViewing) &&
    (!initialValues?.isRepeatingAssignment || isEditingSingleRepeatingAssignment);

  // Reset edit mode when drawer closes or when switching to a different assignment
  useEffect(() => {
    setIsEditMode(false);
    setSelectedModifyRepeatingAssignmentMode(undefined);
  }, [open, initialValues?.id]);

  const userSuggester = useSuggester('practitioner');

  const { mutateAsync: checkOverlappingLeaves } = useOverlappingLeavesQuery();
  const {
    mutateAsync: checkOverlappingAssignments,
  } = useLocationAssignmentOverlappingAssignmentsMutation();

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

  const handleSubmit = async (
    { userId, locationId, date, startTime, endTime, isRepeatingAssignment, schedule },
    { resetForm },
  ) => {
    const payload = {
      id: initialValues.id,
      userId,
      locationId,
      date,
      startTime: toDateTimeString(startTime).split(' ')[1],
      endTime: toDateTimeString(endTime).split(' ')[1],
    };
    if ((isRepeatingAssignment && !isViewing) || isEditingMultipleRepeatingAssignments) {
      payload.repeatFrequency = schedule.interval;
      payload.repeatUnit = schedule.frequency;
      payload.repeatEndDate = schedule.occurrenceCount
        ? getLastFrequencyDate(
            date,
            schedule.interval,
            schedule.frequency,
            schedule.occurrenceCount,
          )
        : toDateString(schedule.untilDate);
      if (isEditingMultipleRepeatingAssignments) {
        payload.updateAllNextRecords = true;
      }
      const overlapAssignments = await checkOverlappingAssignments(payload);
      if (overlapAssignments.length > 0) {
        setOverlappingRepeatingAssignments(overlapAssignments);
        return;
      }

      const overlappingLeaves = await checkOverlappingLeaves(payload);
      if (overlappingLeaves.length > 0) {
        setOverlappingLeaves(overlappingLeaves);
        setHandleConfirmOverlappingLeaves(() => () => {
          handleCloseOverlappingLeaves();
          mutateAssignment(payload, {
            onSuccess: () => {
              updateSelectedCell({ locationId: null, date: null });
              onClose();
              resetForm();
            },
            onError: error => {
              toast.error(error.message);
            },
          });
        });
        return;
      }
    }
    mutateAssignment(payload, {
      onSuccess: () => {
        updateSelectedCell({ locationId: null, date: null });
        onClose();
        resetForm();
      },
      onError: error => {
        toast.error(error.message);
      },
    });
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async ({ deleteFuture }) => {
    await deleteAssignment({ id: initialValues.id, deleteFuture });
    setIsDeleteModalOpen(false);
    updateSelectedCell({ locationId: null, date: null });
    onClose();
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleConfirmModifyRepeatingAssignment = mode => {
    setSelectedModifyRepeatingAssignmentMode(mode);
    setIsEditMode(true);
    setIsConfirmModifyRepeatingAssignmentModalOpen(false);
  };

  const handleCloseOverlappingLeaves = () => {
    setOverlappingLeaves(null);
    setHandleConfirmOverlappingLeaves(null);
  };

  const requiredMessage = getTranslation('validation.required.inline', '*Required');

  const checkLeaveOverlap = useCallback(
    async (userId, date, setFieldError, setStatus) => {
      if (!userId || !date || isViewing) {
        setFieldError('date', ''); // Clear error when user or date is empty
        return;
      }

      const overlappingLeaves = await checkOverlappingLeaves({
        userId,
        date,
      });
      if (overlappingLeaves?.length > 0) {
        setFieldError(
          'date',
          <TranslatedText
            stringId="locationAssignment.form.new.error"
            fallback="User has scheduled leave on this date"
          />,
        );
        // Force the form to show errors by setting submit status
        setStatus({ submitStatus: SUBMIT_ATTEMPTED_STATUS });
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

        const overlappingLeaves = await checkOverlappingLeaves({
          userId: this.parent.userId,
          date: value,
        });

        if (overlappingLeaves?.length > 0) {
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
    schedule: yup.object().when('isRepeatingAssignment', {
      is: true,
      then: yup.object().shape(
        {
          interval: yup
            .number()
            .positive()
            .required(requiredMessage)
            .translatedLabel(
              <TranslatedText
                stringId="locationAssignment.form.repeating.interval.label"
                fallback="Interval"
              />,
            ),
          frequency: yup.string().required(requiredMessage),
          occurrenceCount: yup.mixed().when('untilDate', {
            is: val => !val,
            then: yup
              .number()
              .required(requiredMessage)
              .min(
                2,
                getTranslation('validation.rule.atLeastN', 'Must be at least :n', {
                  replacements: { n: 2 },
                }),
              ),
            otherwise: yup.number().nullable(),
          }),
          untilDate: yup.mixed().when('occurrenceCount', {
            is: val => !isNumber(val),
            then: yup.string().required(requiredMessage),
            otherwise: yup.string().nullable(),
          }),
          daysOfWeek: yup
            .array()
            .of(yup.string().oneOf(DAYS_OF_WEEK))
            // Note: currently supports a single day of the week
            .length(1),
          nthWeekday: yup
            .number()
            .nullable()
            .min(-1)
            .max(4),
        },
        ['untilDate', 'occurrenceCount'],
      ),
    }),
  });

  const renderForm = ({ values, setFieldError, setStatus, setFieldValue, setFieldTouched }) => {
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

    const handleChangeIsRepeatingAssignment = e => {
      if (e.target.checked) {
        setFieldValue('schedule', ASSIGNMENT_SCHEDULE_INITIAL_VALUES);
        handleUpdateScheduleToStartTime(parseISO(values.date));
      } else {
        setFieldError('schedule', undefined);
        setFieldTouched('schedule', false);
        setFieldValue('schedule', {});
      }
    };

    const handleUpdateScheduleToStartTime = startTimeDate => {
      if (!values.schedule) return;
      const { frequency } = values.schedule;
      // Update the ordinal positioning of the new date
      setFieldValue(
        'schedule.nthWeekday',
        frequency === REPEAT_FREQUENCY.MONTHLY ? getWeekdayOrdinalPosition(startTimeDate) : null,
      );
      // Note: currently supports a single day of the week
      setFieldValue('schedule.daysOfWeek', [dateFnsFormat(startTimeDate, 'iiiiii').toUpperCase()]);

      // Don't update the until date if occurrence count is set
      if (!values.schedule.occurrenceCount) {
        handleResetRepeatUntilDate(startTimeDate);
      }
    };

    const handleResetRepeatUntilDate = () => {
      const { untilDate: initialUntilDate } = initialValues.schedule || {};
      setFieldValue(
        'schedule.untilDate',
        initialUntilDate || toDateString(add(new Date(), { months: maxFutureMonths })),
      );
    };

    const handleUpdateDate = event => {
      if (event.target.value) {
        handleUpdateScheduleToStartTime(parseISO(event.target.value));
        updateSelectedCell({ date: parseISO(event.target.value) });
      }
    };

    const onEdit = () => {
      if (isEditMode) {
        setIsEditMode(false);
      } else {
        if (initialValues.isRepeatingAssignment) {
          setIsConfirmModifyRepeatingAssignmentModalOpen(true);
        } else {
          setIsEditMode(true);
        }
      }
    };

    const handleClose = () => {
      updateSelectedCell({ locationId: null, date: null });
      onClose();
    };

    return (
      <Drawer
        open={open}
        onClose={handleClose}
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
        onEdit={isViewing && hasWritePermission ? onEdit : undefined}
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
            onChange={e => {
              updateSelectedCell({ locationId: e.target.value });
            }}
            data-testid="field-lmrx"
            showAllLocations
            facilityId={facilityId}
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
            max={toDateString(add(new Date(), { months: 24 }))}
            onChange={handleUpdateDate}
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
            bookingSlotSettingsOverride={initialValues?.bookingSlots}
          />
          {!hideRepeatingFields && (
            <Field
              name="isRepeatingAssignment"
              onChange={handleChangeIsRepeatingAssignment}
              disabled={!values.date || isEditMode || isViewing}
              label={
                <TranslatedText
                  stringId="locationAssignment.form.isRepeatingAssignment.label"
                  fallback="Repeating assignment"
                />
              }
              component={SwitchField}
            />
          )}
          {values.isRepeatingAssignment && !hideRepeatingFields && (
            <RepeatingFields
              schedule={values.schedule}
              startTime={values.date || toDateString(new Date())}
              setFieldValue={setFieldValue}
              setFieldError={setFieldError}
              handleResetRepeatUntilDate={handleResetRepeatUntilDate}
              readonly={isViewing && !isEditingMultipleRepeatingAssignments}
              maxFutureMonths={maxFutureMonths}
              data-testid="repeatingappointmentfields-xd2i"
            />
          )}
          {isViewing && !isEditMode ? (
            <StyledButtonRow>
              <div>
                {hasDeletePermission && (
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
                )}
              </div>
              <StyledButton onClick={handleClose} data-testid="close-button">
                <TranslatedText
                  stringId="general.action.close"
                  fallback="Close"
                  data-testid="translatedtext-close"
                />
              </StyledButton>
            </StyledButtonRow>
          ) : (
            <StyledFormSubmitCancelRow
              onCancel={handleClose}
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
      {isDeleteModalOpen && (
        <DeleteLocationAssignmentModal
          open
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          assignment={initialValues}
          data-testid="delete-assignment-modal"
        />
      )}
      {isConfirmModifyRepeatingAssignmentModalOpen && (
        <ModifyRepeatingAssignmentModal
          open
          onClose={() => setIsConfirmModifyRepeatingAssignmentModalOpen(false)}
          onConfirm={handleConfirmModifyRepeatingAssignment}
        />
      )}
      {overlappingRepeatingAssignments && (
        <OverlappingRepeatingAssignmentModal
          open
          onClose={() => setOverlappingRepeatingAssignments(null)}
          overlappingRepeatingAssignments={overlappingRepeatingAssignments}
        />
      )}
      {overlappingLeaves && (
        <OverlappingLeavesModal
          open
          onClose={handleCloseOverlappingLeaves}
          overlappingLeaves={overlappingLeaves}
          onConfirm={handleConfirmOverlappingLeaves}
        />
      )}
    </>
  );
};
