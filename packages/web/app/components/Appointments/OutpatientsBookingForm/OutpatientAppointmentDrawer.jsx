import React, { useEffect, useState } from 'react';
import { PriorityHigh as HighPriorityIcon } from '@material-ui/icons';
import { isNumber, omit, set } from 'lodash';
import { format, isAfter, parseISO, add } from 'date-fns';
import { useFormikContext } from 'formik';
import styled from 'styled-components';
import * as yup from 'yup';

import {
  DAYS_OF_WEEK,
  MODIFY_REPEATING_APPOINTMENT_MODE,
  REPEAT_FREQUENCY,
} from '@tamanu/constants';
import { getWeekdayOrdinalPosition } from '@tamanu/utils/appointmentScheduling';
import { toDateString } from '@tamanu/utils/dateTime';

import { usePatientSuggester, useSuggester } from '../../../api';
import { useAppointmentMutation } from '../../../api/mutations';
import { usePatientDataQuery } from '../../../api/queries/usePatientDataQuery';
import { Colors, FORM_TYPES } from '../../../constants';
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
  TextField,
  SwitchField,
} from '../../Field';
import { FormGrid } from '../../FormGrid';
import { TranslatedText } from '../../Translation/TranslatedText';
import { DateTimeFieldWithSameDayWarning } from './DateTimeFieldWithSameDayWarning';
import { TimeWithFixedDateField } from './TimeWithFixedDateField';
import { ENDS_MODES, RepeatingAppointmentFields } from './RepeatingAppointmentFields';

const IconLabel = styled.div`
  display: flex;
  align-items: center;
`;

// The amount of months in future to default the repeat until date to
const INITIAL_UNTIL_DATE_MONTHS_INCREMENT = 6;

const APPOINTMENT_SCHEDULE_INITIAL_VALUES = {
  interval: 1,
  frequency: REPEAT_FREQUENCY.WEEKLY,
  endsMode: ENDS_MODES.ON,
};

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
      />
    );
  }

  if (isLockedPatient) {
    return (
      <TranslatedText
        stringId="outpatientAppointment.form.newForPatient.description"
        fallback="Complete appointment details below to create a new appointment for the selected patient."
      />
    );
  }

  return (
    <TranslatedText
      stringId="outpatientAppointment.form.new.description"
      fallback="Select a patient from the below list and add relevant appointment details to create a new appointment."
    />
  );
};

const WarningModal = ({ open, setShowWarningModal, resolveFn, isEdit }) => {
  const handleClose = confirmed => {
    setShowWarningModal(false);
    resolveFn(confirmed);
  };
  return (
    <ConfirmModal
      title={
        isEdit ? (
          <TranslatedText
            stringId="outpatientAppointments.cancelWarningModal.edit.title"
            fallback="Cancel modifying appointment"
          />
        ) : (
          <TranslatedText
            stringId="outpatientAppointments.cancelWarningModal.create.title"
            fallback="Cancel new appointment"
          />
        )
      }
      subText={
        isEdit ? (
          <TranslatedText
            stringId="outpatientAppointments.cancelWarningModal.edit.subtext"
            fallback="Are you sure you would like to cancel modifying the appointment?"
          />
        ) : (
          <TranslatedText
            stringId="outpatientAppointments.cancelWarningModal.create.subtext"
            fallback="Are you sure you would like to cancel the new appointment?"
          />
        )
      }
      open={open}
      onConfirm={() => {
        handleClose(true);
      }}
      cancelButtonText={
        <TranslatedText stringId="appointments.action.backToEditing" fallback="Back to editing" />
      }
      onCancel={() => {
        handleClose(false);
      }}
    />
  );
};

const SuccessMessage = ({ isEdit = false }) => {
  return isEdit ? (
    <TranslatedText
      stringId="outpatientAppointment.notification.edit.success"
      fallback="Appointment successfully modified"
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.notification.create.success"
      fallback="Appointment successfully created"
    />
  );
};

const ErrorMessage = ({ isEdit = false, error }) => {
  return isEdit ? (
    <TranslatedText
      stringId="outpatientAppointment.notification.edit.error"
      fallback="Failed to edit appointment with error: :error"
      replacements={{ error: error.message }}
    />
  ) : (
    <TranslatedText
      stringId="outpatientAppointment.notification.create.error"
      fallback="Failed to create appointment with error: :error"
      replacements={{ error: error.message }}
    />
  );
};

const EmailFields = ({ patientId }) => {
  const { setFieldValue } = useFormikContext();
  const { data: patient } = usePatientDataQuery(patientId);

  // Keep form state up to date with relevant selected patient email
  useEffect(() => {
    setFieldValue('email', patient?.email ?? '');
    setFieldValue('confirmEmail', '');
  }, [patient?.email, setFieldValue]);

  return (
    <>
      <Field
        name="email"
        label={
          <TranslatedText stringId="appointment.emailAddress.label" fallback="Email address" />
        }
        required
        component={TextField}
      />
      <Field
        name="confirmEmail"
        label={
          <TranslatedText
            stringId="appointment.confirmEmailAddress.label"
            fallback="Confirm email address"
          />
        }
        required
        component={TextField}
      />
    </>
  );
};

export const OutpatientAppointmentDrawer = ({ open, onClose, initialValues = {}, modifyMode }) => {
  const { getTranslation } = useTranslation();
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const appointmentTypeSuggester = useSuggester('appointmentType');
  const locationGroupSuggester = useSuggester('facilityLocationGroup');

  const isEdit = !!initialValues.id;
  const isCreate = !isEdit;
  const isLockedPatient = !!initialValues.patientId;
  const showScheduleFields =
    isCreate || modifyMode === MODIFY_REPEATING_APPOINTMENT_MODE.THIS_AND_FUTURE_APPOINTMENTS;

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);

  const requiredMessage = getTranslation('validation.required.inline', '*Required');
  const validationSchema = yup.object().shape(
    {
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
            const startTime = parseISO(parent.startTime);
            const endTime = parseISO(value);
            return isAfter(endTime, startTime);
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
                  getTranslation('validation.rule.atLeastN', 'Must be at least :n', { n: 2 }),
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
    },
    ['isRepeatingAppointment', 'schedule.untilDate', 'schedule.occurrenceCount'],
  );

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
      const confirmed = !dirty || (await handleShowWarningModal());
      if (!confirmed) return;
      onClose();
      resetForm();
    };

    const handleResetRepeatUntilDate = startTimeDate => {
      setFieldValue(
        'schedule.untilDate',
        toDateString(add(startTimeDate, { months: INITIAL_UNTIL_DATE_MONTHS_INCREMENT })),
      );
    };

    const handleResetEmailFields = e => {
      if (e.target.checked) return;
      setFieldValue('email', '');
      setFieldValue('confirmEmail', '');
    };

    const handleChangeIsRepeatingAppointment = async e => {
      if (e.target.checked) {
        const startTimeDate = parseISO(values.startTime);
        setValues(
          set(values, 'schedule', {
            ...APPOINTMENT_SCHEDULE_INITIAL_VALUES,
            untilDate: toDateString(
              add(parseISO(values.startTime), { months: INITIAL_UNTIL_DATE_MONTHS_INCREMENT }),
            ),
            daysOfWeek: [format(startTimeDate, 'iiiiii').toUpperCase()],
          }),
        );
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
      setFieldValue('schedule.daysOfWeek', [format(startTimeDate, 'iiiiii').toUpperCase()]);

      handleResetRepeatUntilDate(startTimeDate);
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
            />
          ) : (
            <TranslatedText
              stringId="outpatientAppointment.form.new.heading"
              fallback="New outpatient appointment"
            />
          )
        }
        description={getDescription(isEdit, isLockedPatient)}
      >
        <FormGrid columns={1}>
          <Field
            name="patientId"
            label={<TranslatedText stringId="general.form.patient.label" fallback="Patient" />}
            placeholder={getTranslation(
              'scheduling.filter.placeholder.patientNameOrId',
              'Search patient name or ID',
            )}
            component={AutocompleteField}
            suggester={patientSuggester}
            disabled={isLockedPatient}
            required
          />
          <Field
            label={
              <TranslatedText
                stringId="general.localisedField.locationGroupId.label"
                fallback="Area"
              />
            }
            name="locationGroupId"
            component={AutocompleteField}
            suggester={locationGroupSuggester}
            required
          />
          <Field
            name="appointmentTypeId"
            label={
              <TranslatedText
                stringId="appointment.appointmentType.label"
                fallback="Appointment type"
              />
            }
            component={DynamicSelectField}
            suggester={appointmentTypeSuggester}
            required
          />
          <Field
            name="clinicianId"
            label={
              <TranslatedText
                stringId="general.localisedField.clinician.label"
                fallback="Clinician"
              />
            }
            component={AutocompleteField}
            suggester={clinicianSuggester}
          />
          <DateTimeFieldWithSameDayWarning
            isEdit={isEdit}
            onChange={e => {
              const newValue = e.target.value;
              setFieldValue('startTime', newValue);
              handleUpdateScheduleToStartTime(parseISO(newValue));
            }}
          />
          <Field
            name="endTime"
            disabled={!values.startTime}
            date={values.startTime && parseISO(values.startTime)}
            label={<TranslatedText stringId="general.endTime.label" fallback="End time" />}
            component={TimeWithFixedDateField}
            saveDateAsString
          />
          <Field
            name="isHighPriority"
            style={{ width: 'fit-content' }}
            label={
              <IconLabel>
                <TranslatedText stringId="general.highPriority.label" fallback="High priority" />
                <HighPriorityIcon
                  aria-label="High priority"
                  aria-hidden={undefined}
                  htmlColor={Colors.alert}
                  style={{ fontSize: 18 }}
                />
              </IconLabel>
            }
            component={CheckField}
          />
          <Field
            name="shouldEmailAppointment"
            label={
              <TranslatedText
                stringId="appointment.emailAppointment.label"
                fallback="Email appointment"
              />
            }
            component={CheckField}
            onChange={handleResetEmailFields}
          />
          {values.shouldEmailAppointment && <EmailFields patientId={values.patientId} />}
          <Field
            name="isRepeatingAppointment"
            onChange={handleChangeIsRepeatingAppointment}
            disabled={!values.startTime || isEdit}
            value={!!values.schedule}
            label={
              <TranslatedText
                stringId="appointment.isRepeatingAppointment.label"
                fallback="Repeating appointment"
              />
            }
            component={SwitchField}
          />
          {values.schedule && showScheduleFields && (
            <RepeatingAppointmentFields
              values={values}
              setFieldValue={setFieldValue}
              setFieldError={setFieldError}
              handleResetRepeatUntilDate={handleResetRepeatUntilDate}
            />
          )}
          <FormSubmitCancelRow onCancel={warnAndResetForm} />
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
      notifySuccess(<SuccessMessage isEdit={isEdit} />);
      onClose();
    },
    onError: error => {
      notifyError(<ErrorMessage isEdit={isEdit} error={error} />);
    },
  });

  const handleSubmitForm = async (values, { resetForm }) => {
    await handleSubmit({ ...values, modifyMode });
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
        initialValues={initialValues}
        enableReinitialize
        validateOnChange
        render={renderForm}
      />
      <WarningModal
        open={warningModalOpen}
        setShowWarningModal={setShowWarningModal}
        resolveFn={resolveFn}
        isEdit={isEdit}
      />
    </>
  );
};
