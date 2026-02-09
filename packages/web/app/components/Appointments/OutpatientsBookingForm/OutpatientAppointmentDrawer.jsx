import React, { useMemo, useState } from 'react';
import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import { isNumber, omit, set } from 'lodash';
import {
  isAfter,
  parseISO,
  add,
  set as dateFnsSet,
  getYear,
  getDate,
  getMonth,
} from 'date-fns';
import styled from 'styled-components';
import * as yup from 'yup';

import {
  DAYS_OF_WEEK,
  MODIFY_REPEATING_APPOINTMENT_MODE,
  REPEAT_FREQUENCY,
  FORM_TYPES,
} from '@tamanu/constants';
import { getWeekdayOrdinalPosition } from '@tamanu/utils/appointmentScheduling';
import { toDateString, toDateTimeString, toWeekdayCode } from '@tamanu/utils/dateTime';

import { usePatientSuggester, useSuggester } from '../../../api';
import { useAppointmentMutation } from '../../../api/mutations';
import { useTranslation } from '../../../contexts/Translation';
import { notifyError, notifySuccess } from '../../../utils';
import { ConfirmModal } from '../../ConfirmModal';
import { Drawer } from '../../Drawer';
import { AutocompleteField, CheckField, DynamicSelectField, Field, SwitchField } from '../../Field';
import { Form, FormGrid, FormSubmitCancelRow, useDateTimeFormat } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { TranslatedText } from '../../Translation/TranslatedText';
import { DateTimeFieldWithSameDayWarning } from './DateTimeFieldWithSameDayWarning';
import { TimeWithFixedDateField } from './TimeWithFixedDateField';
import { RepeatingFields } from '../RepeatingFields';
import { APPOINTMENT_SCHEDULE_INITIAL_VALUES } from '../../../constants/locationAssignments';
import { EmailSection } from '../EmailSection';

export const INITIAL_UNTIL_DATE_MONTHS_INCREMENT = 6;

const IconLabel = styled.div`
  display: flex;
  align-items: center;
`;

const formStyles = {
  overflowY: 'auto',
  minWidth: 'fit-content',
};

const getDescription = (isEdit, isLockedPatient) => {
  if (isEdit) {
    return (
      <TranslatedText
        stringId="outpatientAppointment.form.edit.description"
        fallback="Modify the selected appointment below."
        data-testid="translatedtext-uafv"
      />
    );
  }

  if (isLockedPatient) {
    return (
      <TranslatedText
        stringId="outpatientAppointment.form.newForPatient.description"
        fallback="Complete appointment details below to create a new appointment for the selected patient."
        data-testid="translatedtext-pjmv"
      />
    );
  }

  return (
    <TranslatedText
      stringId="outpatientAppointment.form.new.description"
      fallback="Select a patient from the below list and add relevant appointment details to create a new appointment."
      data-testid="translatedtext-epcp"
    />
  );
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
          stringId="outpatientAppointments.cancelWarningModal.title"
          fallback="Cancel appointment modification"
          data-testid="translatedtext-invo"
        />
      }
      subText={
        <TranslatedText
          stringId="outpatientAppointments.cancelWarningModal.subtext"
          fallback="Are you sure you would like to cancel modifying the appointment?"
          data-testid="translatedtext-4bt3"
        />
      }
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText={
        <TranslatedText
          stringId="appointments.action.backToEditing"
          fallback="Back to editing"
          data-testid="translatedtext-7b8p"
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="appointments.action.cancelModification"
          fallback="Cancel modification"
          data-testid="translatedtext-rfq5"
        />
      }
      onCancel={() => {
        handleClose(false);
      }}
      data-testid="confirmmodal-x4hg"
    />
  );
};

const SuccessMessage = ({ isEdit = false }) => {
  return isEdit ? (
    <TranslatedText
      stringId="outpatientAppointment.notification.edit.success"
      fallback="Appointment successfully modified"
      data-testid="translatedtext-aqt6"
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.notification.create.success"
      fallback="Appointment successfully created"
      data-testid="translatedtext-mnyi"
    />
  );
};

const ErrorMessage = ({ isEdit = false, error }) => {
  return isEdit ? (
    <TranslatedText
      stringId="outpatientAppointment.notification.edit.error"
      fallback="Failed to edit appointment with error: :error"
      replacements={{ error: error.message }}
      data-testid="translatedtext-91gu"
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.notification.create.error"
      fallback="Failed to create appointment with error: :error"
      replacements={{ error: error.message }}
      data-testid="translatedtext-p7ph"
    />
  );
};

export const OutpatientAppointmentDrawer = ({ open, onClose, initialValues = {}, modifyMode }) => {
  const { getTranslation } = useTranslation();
  const { toDateTimeStringForPersistence, formatForDateTimeInput } = useDateTimeFormat();
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const appointmentTypeSuggester = useSuggester('appointmentType');
  const locationGroupSuggester = useSuggester('facilityLocationGroup');

  const isEdit = !!initialValues.id;
  const isLockedPatient = !!initialValues.patientId;
  const hideIsRepeatingToggle = isEdit && !initialValues.schedule;

  // Convert endTime from country timezone to facility timezone for form state,
  // since TimeWithFixedDateField operates in facility timezone and handleSubmitForm
  // converts back to country timezone via toDateTimeStringForPersistence on save.
  const processedInitialValues = useMemo(() => {
    if (!initialValues.endTime) return initialValues;
    const facilityEndTimeStr = formatForDateTimeInput(initialValues.endTime);
    if (!facilityEndTimeStr) return initialValues;
    return {
      ...initialValues,
      endTime: facilityEndTimeStr.replace('T', ' ') + ':00',
    };
  }, [initialValues, formatForDateTimeInput]);

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const requiredMessage = getTranslation('validation.required.inline', '*Required');
  const validationSchema = yup.object().shape({
    locationGroupId: yup.string().required(requiredMessage),
    appointmentTypeId: yup.string().required(requiredMessage),
    startTime: yup.string().required(requiredMessage),
    endTime: yup
      .string()
      .nullable()
      .test(
        'isAfter',
        getTranslation(
          'outpatientAppointments.endTime.validation.isAfterStartTime',
          'End time must be after start time',
        ),
        (value, { parent }) => {
          if (!value) return true;
          const endTimeCountry = toDateTimeStringForPersistence(value);
          if (!endTimeCountry) return true;
          return isAfter(parseISO(endTimeCountry), parseISO(parent.startTime));
        },
      ),
    patientId: yup.string().required(requiredMessage),
    shouldEmailAppointment: yup.boolean(),
    email: yup.string().when('shouldEmailAppointment', {
      is: true,
      then: yup
        .string()
        .required(requiredMessage)
        .email(getTranslation('validation.rule.validEmail', 'Must be a valid email address')),
    }),
    confirmEmail: yup.string().when('shouldEmailAppointment', {
      is: true,
      then: yup
        .string()
        .required(requiredMessage)
        .oneOf(
          [yup.ref('email')],
          getTranslation('validation.rule.emailsMatch', 'Emails must match'),
        ),
    }),
    schedule: yup.object().when('isRepeatingAppointment', {
      is: true,
      then: yup.object().shape(
        {
          interval: yup.number().required(requiredMessage),
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

  const renderForm = ({
    values,
    resetForm,
    dirty,
    setFieldValue,
    setFieldTouched,
    setFieldError,
    setValues,
  }) => {
    const warnAndResetForm = async () => {
      const requiresWarning = dirty && isEdit;
      const confirmed = !requiresWarning || (await handleShowWarningModal());
      if (!confirmed) return;
      onClose();
      resetForm();
    };

    const handleResetRepeatUntilDate = startTimeDate => {
      const { untilDate: initialUntilDate } = initialValues.schedule || {};
      setFieldValue(
        'schedule.untilDate',
        initialUntilDate ||
          toDateString(add(startTimeDate, { months: INITIAL_UNTIL_DATE_MONTHS_INCREMENT })),
      );
    };

    const handleChangeIsRepeatingAppointment = async e => {
      if (e.target.checked) {
        setValues(set(values, 'schedule', APPOINTMENT_SCHEDULE_INITIAL_VALUES));
        handleUpdateScheduleToStartTime(parseISO(values.startTime));
      } else {
        setFieldError('schedule', undefined);
        setFieldTouched('schedule', false);
        setValues(omit(values, ['schedule']));
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
      setFieldValue('schedule.daysOfWeek', [toWeekdayCode(startTimeDate)]);

      // Don't update the until date if occurrence count is set
      if (!values.schedule.occurrenceCount) {
        handleResetRepeatUntilDate(startTimeDate);
      }
    };

    const handleUpdateStartTime = event => {
      const startTimeDate = parseISO(event.target.value);
      handleUpdateScheduleToStartTime(startTimeDate);
      if (!values.endTime) return;
      const facilityStartStr = formatForDateTimeInput(event.target.value);
      const endDate =
        facilityStartStr ?
          parseISO(`${facilityStartStr.slice(0, 10)}T00:00:00`)
        : startTimeDate;
      setFieldValue(
        'endTime',
        toDateTimeString(
          dateFnsSet(parseISO(values.endTime), {
            year: getYear(endDate),
            date: getDate(endDate),
            month: getMonth(endDate),
          }),
        ),
      );
    };

    return (
      <Drawer
        open={open}
        onClose={warnAndResetForm}
        title={
          isEdit ? (
            <TranslatedText
              stringId="outpatientAppointment.form.edit.heading"
              fallback="Modify outpatient appointment"
              data-testid="translatedtext-ewkn"
            />
          ) : (
            <TranslatedText
              stringId="outpatientAppointment.form.new.heading"
              fallback="New outpatient appointment"
              data-testid="translatedtext-ybqa"
            />
          )
        }
        description={getDescription(isEdit, isLockedPatient)}
        data-testid="drawer-iph2"
      >
        <FormGrid columns={1} data-testid="formgrid-riga">
          <Field
            name="patientId"
            label={
              <TranslatedText
                stringId="general.form.patient.label"
                fallback="Patient"
                data-testid="translatedtext-xoq8"
              />
            }
            placeholder={getTranslation(
              'scheduling.filter.placeholder.patientNameOrId',
              'Search patient name or ID',
            )}
            component={AutocompleteField}
            suggester={patientSuggester}
            disabled={isLockedPatient}
            required
            data-testid="field-peaf"
          />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.locationGroupId.label"
                fallback="Area"
                data-testid="translatedtext-i56k"
              />
            }
            name="locationGroupId"
            component={AutocompleteField}
            suggester={locationGroupSuggester}
            required
            data-testid="field-gudr"
          />
          <Field
            name="appointmentTypeId"
            label={
              <TranslatedText
                stringId="appointment.appointmentType.label"
                fallback="Appointment type"
                data-testid="translatedtext-erlj"
              />
            }
            component={DynamicSelectField}
            suggester={appointmentTypeSuggester}
            required
            data-testid="field-djha"
          />
          <Field
            name="clinicianId"
            label={
              <TranslatedText
                stringId="general.localisedField.clinician.label"
                fallback="Clinician"
                data-testid="translatedtext-8he8"
              />
            }
            component={AutocompleteField}
            suggester={clinicianSuggester}
            data-testid="field-nyxe"
          />
          <DateTimeFieldWithSameDayWarning
            isEdit={isEdit}
            onChange={handleUpdateStartTime}
            data-testid="datetimefieldwithsamedaywarning-bh9y"
          />
          <Field
            name="endTime"
            disabled={!values.startTime}
            date={
              values.startTime && formatForDateTimeInput(values.startTime)
                ? parseISO(
                    `${formatForDateTimeInput(values.startTime).slice(0, 10)}T00:00:00`,
                  )
                : undefined
            }
            label={
              <TranslatedText
                stringId="general.endTime.label"
                fallback="End time"
                data-testid="translatedtext-s9qy"
              />
            }
            component={TimeWithFixedDateField}
            saveDateAsString
            data-testid="field-6mrp"
          />
          <Field
            name="isHighPriority"
            style={{ width: 'fit-content' }}
            label={
              <IconLabel data-testid="iconlabel-ijml">
                <TranslatedText
                  stringId="general.highPriority.label"
                  fallback="High priority"
                  data-testid="translatedtext-wk0x"
                />
                <HighPriorityIcon
                  aria-label="High priority"
                  aria-hidden={undefined}
                  htmlColor={Colors.alert}
                  style={{ fontSize: 18 }}
                  data-testid="highpriorityicon-i0bk"
                />
              </IconLabel>
            }
            component={CheckField}
            data-testid="field-vyk1"
          />
          <EmailSection
            label={
              <TranslatedText
                stringId="appointment.emailAppointment.label"
                fallback="Email appointment"
                data-testid="translatedtext-edpi"
              />
            }
          />
          {!hideIsRepeatingToggle && (
            <Field
              name="isRepeatingAppointment"
              onChange={handleChangeIsRepeatingAppointment}
              disabled={!values.startTime || isEdit}
              value={!!values.schedule}
              label={
                <TranslatedText
                  stringId="appointment.isRepeatingAppointment.label"
                  fallback="Repeating appointment"
                  data-testid="translatedtext-e4lo"
                />
              }
              component={SwitchField}
              data-testid="field-chv4"
            />
          )}
          {values.schedule && (
            <RepeatingFields
              initialValues={initialValues}
              schedule={values.schedule}
              startTime={values.startTime}
              setFieldValue={setFieldValue}
              setFieldError={setFieldError}
              handleResetRepeatUntilDate={handleResetRepeatUntilDate}
              readonly={modifyMode === MODIFY_REPEATING_APPOINTMENT_MODE.THIS_APPOINTMENT}
              data-testid="repeatingappointmentfields-xd2i"
            />
          )}
          <FormSubmitCancelRow onCancel={warnAndResetForm} data-testid="formsubmitcancelrow-r1ru" />
        </FormGrid>
      </Drawer>
    );
  };

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const { mutateAsync: handleSubmit } = useAppointmentMutation(initialValues.id, {
    onSuccess: () => {
      notifySuccess(<SuccessMessage isEdit={isEdit} data-testid="successmessage-0rtl" />);
      onClose();
    },
    onError: error => {
      notifyError(<ErrorMessage isEdit={isEdit} error={error} data-testid="errormessage-26wp" />);
    },
  });

  const handleSubmitForm = async (values, { resetForm }) => {
    const endTimeForPersistence = values.endTime
      ? toDateTimeStringForPersistence(values.endTime)
      : values.endTime;
    await handleSubmit({ ...values, endTime: endTimeForPersistence, modifyMode });
    resetForm();
  };

  return (
    <>
      <Form
        onSubmit={handleSubmitForm}
        style={formStyles}
        suppressErrorDialog
        formType={isEdit ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        validationSchema={validationSchema}
        initialValues={processedInitialValues}
        enableReinitialize
        render={renderForm}
        data-testid="form-mvw4"
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
        data-testid="warningmodal-h7ov"
      />
    </>
  );
};
