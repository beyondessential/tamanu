import OvernightIcon from '@material-ui/icons/Brightness2';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { sub } from 'date-fns';

import { formatShort, toDateTimeString } from '@tamanu/utils/dateTime';
import { Form, FormGrid, FormSubmitCancelRow } from '@tamanu/ui-components';

import { usePatientSuggester, useSuggester } from '../../../api';
import { useCheckOnLeaveMutation, useLocationBookingMutation } from '../../../api/mutations';
import { Colors } from '../../../constants';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';
import { useTranslation } from '../../../contexts/Translation';
import { notifyError, notifySuccess } from '../../../utils';
import { ConfirmModal } from '../../ConfirmModal';
import { Drawer } from '../../Drawer';
import {
  AutocompleteField,
  CheckField,
  DynamicSelectField,
  Field,
  LocalisedLocationField,
  MultiAutocompleteField,
} from '../../Field';
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';
import { DateTimeRangeField } from './DateTimeRangeField';
import { BodyText } from '../../Typography';
import { EmailSection } from '../EmailSection';
import { ENCOUNTER_TYPE_LABELS, ENCOUNTER_TYPES, FORM_TYPES } from '@tamanu/constants';

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
          data-testid="translatedtext-wlb9"
        />
      }
      subText={
        <TranslatedText
          stringId="locationBooking.cancelWarningModal.subtext"
          fallback="Are you sure you would like to cancel modifying the booking?"
          data-testid="translatedtext-u1o4"
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
          data-testid="translatedtext-loz1"
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="locationBooking.cancelWarningModal.cancelModification"
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
      stringId="locationBooking.notification.bookingSuccessfullyModified"
      fallback="Booking successfully modified"
      data-testid="translatedtext-z8jo"
    />
  ) : (
    <TranslatedText
      stringId="locationBooking.notification.bookingSuccessfullyCreated"
      fallback="Booking successfully created"
      data-testid="translatedtext-icwl"
    />
  );

const ErrorMessage = ({ isEdit = false, error }) => {
  return isEdit ? (
    <TranslatedText
      stringId="locationBooking.notification.edit.error"
      fallback="Failed to edit booking with error: :error"
      replacements={{ error: error.message }}
      data-testid="translatedtext-85ei"
    />
  ) : (
    <TranslatedText
      stringId="locationBooking.notification.create.error"
      fallback="Failed to create booking with error: :error"
      replacements={{ error: error.message }}
      data-testid="translatedtext-0s83"
    />
  );
};

export const LocationBookingDrawer = ({ open, onClose, initialValues }) => {
  const { getTranslation, getEnumTranslation, getReferenceDataTranslation } = useTranslation();
  const { updateSelectedCell, viewType } = useLocationBookingsContext();
  const isEdit = !!initialValues.id;

  const { mutateAsync: checkOnLeave } = useCheckOnLeaveMutation();

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);
  const [selectedPatientId, setSelectedPatientId] = useState(initialValues?.patientId ?? null);
  const [selectedClinicianId, setSelectedClinicianId] = useState(
    initialValues?.clinicianId ?? null,
  );
  const [selectedAdditionalClinicianId, setSelectedAdditionalClinicianId] = useState(
    initialValues?.additionalClinicianId ?? null,
  );
  const [selectedDate, setSelectedDate] = useState(initialValues?.date ?? null);
  const [selectedSeparateDate, setSelectedSeparateDate] = useState({
    startDate: initialValues?.startDate ?? null,
    endDate: initialValues?.endDate ?? null,
  });
  const [isOvernight, setIsOvernight] = useState(initialValues?.overnight ?? false);
  const [clinicianHasLeave, setClinicianHasLeave] = useState(false);
  const [additionalClinicianHasLeave, setAdditionalClinicianHasLeave] = useState(false);

  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const additionalClinicianSuggester = useSuggester('practitioner');
  const bookingTypeSuggester = useSuggester('bookingType');
  const procedureTypeSuggester = useSuggester('procedureType');
  const encounterSuggester = useSuggester('encounter', {
    formatter: encounter => ({
      value: encounter.id,
      // should display encounter current if the encounter is active
      label: `${formatShort(encounter.startDate)}${
        encounter.endDate
          ? ''
          : ' - ' + getTranslation('general.date.current', 'Current').toLowerCase()
      } | ${getEnumTranslation(
        ENCOUNTER_TYPE_LABELS,
        encounter.encounterType,
      )} | ${getReferenceDataTranslation({
        value: encounter?.location?.facility.id,
        category: 'facility',
        fallback: encounter?.location?.facility.name,
      })}`,
    }),
    baseQueryParameters: {
      encounterTypes: [
        ENCOUNTER_TYPES.ADMISSION,
        ENCOUNTER_TYPES.CLINIC,
        ENCOUNTER_TYPES.EMERGENCY,
        ENCOUNTER_TYPES.IMAGING,
        ENCOUNTER_TYPES.OBSERVATION,
        ENCOUNTER_TYPES.TRIAGE,
      ],
      after: toDateTimeString(sub(new Date(), { months: 6 })),
      patientId: selectedPatientId,
    },
  });

  useEffect(() => {
    handleCheckClinicianOnLeave();
  }, [selectedClinicianId, selectedDate, selectedSeparateDate, isOvernight]);

  useEffect(() => {
    handleCheckAdditionalClinicianOnLeave();
  }, [selectedAdditionalClinicianId, selectedDate, selectedSeparateDate, isOvernight]);

  const handleCheckClinicianOnLeave = async () => {
    const shouldCheckOnLeave =
      selectedClinicianId &&
      (isOvernight
        ? selectedSeparateDate?.startDate && selectedSeparateDate?.endDate
        : selectedDate);
    if (!shouldCheckOnLeave) return setClinicianHasLeave(false);
    const payload = isOvernight
      ? {
          startDate: selectedSeparateDate.startDate,
          endDate: selectedSeparateDate.endDate,
        }
      : { startDate: selectedDate, endDate: selectedDate };
    try {
      const { isOnLeave } = await checkOnLeave({ userId: selectedClinicianId, payload });
      setClinicianHasLeave(isOnLeave);
    } catch (error) {
      setClinicianHasLeave(false);
    }
  };

  const handleCheckAdditionalClinicianOnLeave = async () => {
    const shouldCheckOnLeave =
      selectedAdditionalClinicianId &&
      (isOvernight
        ? selectedSeparateDate?.startDate && selectedSeparateDate?.endDate
        : selectedDate);
    if (!shouldCheckOnLeave) return setAdditionalClinicianHasLeave(false);
    const payload = isOvernight
      ? {
          startDate: selectedSeparateDate.startDate,
          endDate: selectedSeparateDate.endDate,
        }
      : { startDate: selectedDate, endDate: selectedDate };

    try {
      const { isOnLeave } = await checkOnLeave({ userId: selectedAdditionalClinicianId, payload });
      setAdditionalClinicianHasLeave(isOnLeave);
    } catch (error) {
      setAdditionalClinicianHasLeave(false);
    }
  };

  const handleShowWarningModal = async () =>
    new Promise(resolve => {
      setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
      setShowWarningModal(true);
    });

  const { mutateAsync: mutateBooking } = useLocationBookingMutation(
    { isEdit },
    {
      onSuccess: () =>
        notifySuccess(<SuccessMessage isEdit={isEdit} data-testid="successmessage-7twp" />),
      onError: error => {
        if (error.message === 409) {
          notifyError(
            <TranslatedText
              stringId="locationBooking.notification.bookingTimeConflict"
              fallback="Booking failed. Booking time no longer available"
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
    {
      locationId,
      startTime,
      endTime,
      patientId,
      bookingTypeId,
      clinicianId,
      additionalClinicianId,
      procedureTypeIds,
      linkEncounterId,
      email,
    },
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
        additionalClinicianId,
        procedureTypeIds,
        linkEncounterId,
        email,
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
    additionalClinicianId: yup.string(),
    procedureTypeIds: yup.array().of(yup.string()),
    linkEncounterId: yup.string(),
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
              data-testid="translatedtext-gykj"
            />
          ) : (
            <TranslatedText
              stringId="locationBooking.form.new.heading"
              fallback="Book location"
              data-testid="translatedtext-nugq"
            />
          )
        }
        description={
          isEdit ? (
            <TranslatedText
              stringId="locationBooking.form.edit.description"
              fallback="Modify the selected booking below."
              data-testid="translatedtext-o9mp"
            />
          ) : (
            <TranslatedText
              stringId="locationBooking.form.new.description"
              fallback="Create a new booking by completing the below details and selecting ‘Confirm’."
              data-testid="translatedtext-p4qw"
            />
          )
        }
        data-testid="drawer-au2a"
      >
        <FormGrid nested columns={1} data-testid="formgrid-71fd">
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
            locationGroupBaseQueryParameters={{
              isBookable: viewType,
            }}
            data-testid="field-lmrx"
          />
          <Field
            name="overnight"
            label={
              <OvernightStayLabel data-testid="overnightstaylabel-fska">
                <TranslatedText
                  stringId="location.overnightStay.label"
                  fallback="Overnight stay"
                  data-testid="translatedtext-9koo"
                />
                <OvernightIcon
                  aria-hidden
                  htmlColor={Colors.primary}
                  style={{ fontSize: 18 }}
                  data-testid="overnighticon-mjii"
                />
              </OvernightStayLabel>
            }
            component={CheckField}
            onChange={e => {
              resetFields(['endDate', 'endTime']);
              setIsOvernight(e.target.checked);
            }}
            data-testid="field-kwns"
          />
          <DateTimeRangeField
            onChangeStartDate={e => {
              resetFields(['startTime']);
              setSelectedSeparateDate({
                startDate: e.target.value,
                endDate: null,
              });
            }}
            onChangeEndDate={e => {
              setSelectedSeparateDate({
                startDate: selectedSeparateDate.startDate,
                endDate: e.target.value,
              });
            }}
            onChange={e => setSelectedDate(e.target.value)}
            required
            separate={values.overnight}
            data-testid="datetimerangefield-7m5q"
          />
          <Field
            component={AutocompleteField}
            label={
              <TranslatedText
                stringId="general.form.patient.label"
                fallback="Patient"
                data-testid="translatedtext-mym5"
              />
            }
            name="patientId"
            placeholder={getTranslation(
              'general.patient.search.placeholder',
              'Search patient name or ID',
            )}
            required
            suggester={patientSuggester}
            onChange={e => setSelectedPatientId(e.target.value)}
            data-testid="field-uglc"
          />
          <Field
            name="bookingTypeId"
            label={
              <TranslatedText
                stringId="location.form.bookingType.label"
                fallback="Booking type"
                data-testid="translatedtext-ohii"
              />
            }
            component={DynamicSelectField}
            suggester={bookingTypeSuggester}
            required
            data-testid="field-hmsi"
          />
          <div style={{ gridColumn: 'span 1' }}>
            <Field
              name="clinicianId"
              label={
                <TranslatedText
                  stringId="general.form.clinician.label"
                  fallback="Clinician"
                  data-testid="translatedtext-i94f"
                />
              }
              component={AutocompleteField}
              suggester={clinicianSuggester}
              onChange={e => setSelectedClinicianId(e.target.value)}
              data-testid="field-j6o6"
            />
            {clinicianHasLeave && (
              <BodyText marginTop={'4px'} color={Colors.midText}>
                <TranslatedText
                  stringId="location.form.clinician.leave"
                  fallback="Clinician has leave scheduled on this date"
                  data-testid="translatedtext-clinicianleave"
                />
              </BodyText>
            )}
          </div>
          <div style={{ gridColumn: 'span 1' }}>
            <Field
              name="additionalClinicianId"
              label={
                <TranslatedText
                  stringId="location.form.additionalClinician.label"
                  fallback="Additional clinician"
                  data-testid="translatedtext-additionalclinician"
                />
              }
              component={AutocompleteField}
              suggester={additionalClinicianSuggester}
              onChange={e => setSelectedAdditionalClinicianId(e.target.value)}
              data-testid="field-additionalclinician"
            />
            {additionalClinicianHasLeave && (
              <BodyText marginTop={'4px'} color={Colors.midText}>
                <TranslatedText
                  stringId="location.form.clinician.leave"
                  fallback="Clinician has leave scheduled on this date"
                  data-testid="translatedtext-clinicianleave"
                />
              </BodyText>
            )}
          </div>
          <Field
            name="procedureTypeIds"
            label={
              <TranslatedText
                stringId="location.form.procedureType.label"
                fallback="Procedure"
                data-testid="translatedtext-proceduretype"
              />
            }
            component={MultiAutocompleteField}
            suggester={procedureTypeSuggester}
            data-testid="field-proceduretype"
          />
          <Field
            name="linkEncounterId"
            label={
              <TranslatedText
                stringId="location.form.encounter.label"
                fallback="Link encounter"
                data-testid="translatedtext-encounter"
              />
            }
            component={AutocompleteField}
            suggester={encounterSuggester}
            data-testid="field-encounter"
            disabled={!values.patientId}
          />
          <EmailSection />
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
