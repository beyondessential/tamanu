import OvernightIcon from '@material-ui/icons/Brightness2';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { formatShort, toDateTimeString } from '@tamanu/utils/dateTime';

import { useApi, usePatientSuggester, useSuggester } from '../../../api';
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
  MultiselectField,
} from '../../Field';
import { FormGrid } from '../../FormGrid';
import { TOP_BAR_HEIGHT } from '../../TopBar';
import { TranslatedText } from '../../Translation/TranslatedText';
import { DateTimeRangeField } from './DateTimeRangeField';
import { ENCOUNTER_TYPES, ENCOUNTER_TYPE_LABELS } from '@tamanu/constants';
import { sub } from 'date-fns';
import { BodyText } from '../../Typography';

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
  const api = useApi();
  const { getTranslation } = useTranslation();
  const { updateSelectedCell } = useLocationBookingsContext();
  const isEdit = !!initialValues.id;
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedClinicianId, setSelectedClinicianId] = useState(null);
  const [selectedAdditionalClinicianId, setSelectedAdditionalClinicianId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [clinicianHasLeave, setClinicianHasLeave] = useState(false);
  const [additionalClinicianHasLeave, setAdditionalClinicianHasLeave] = useState(false);
  const patientSuggester = usePatientSuggester();
  const clinicianSuggester = useSuggester('practitioner');
  const encounterSuggester = useSuggester('encounter', {
    formatter: encounter => ({
      value: encounter.id,
      label: `${formatShort(encounter.startDate)} | ${
        ENCOUNTER_TYPE_LABELS[encounter.encounterType]
      } | ${encounter.location.facility.name}`,
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
      after: sub(new Date(), { months: 6 }).toISOString(),
      patientId: selectedPatientId,
    },
  });
  const bookingTypeSuggester = useSuggester('bookingType');
  const procedureTypeSuggester = useSuggester('procedureType');

  const [warningModalOpen, setShowWarningModal] = useState(false);
  const [resolveFn, setResolveFn] = useState(null);
  const [procedureTypeOptions, setProcedureTypeOptions] = useState([]);

  useEffect(() => {
    handleFetchProcedureTypeOptions();
  }, [procedureTypeSuggester]);

  useEffect(() => {
    handleCheckClinicianHasLeave();
  }, [selectedDate, selectedClinicianId]);

  useEffect(() => {
    handleCheckAdditionalClinicianHasLeave();
  }, [selectedDate, selectedAdditionalClinicianId]);

  const handleFetchProcedureTypeOptions = async () => {
    const options = await procedureTypeSuggester.fetchSuggestions();
    setProcedureTypeOptions(options);
  };

  const handleCheckClinicianHasLeave = async () => {
    if (!selectedDate || !selectedClinicianId) {
      setClinicianHasLeave(false);
      return;
    }
    const user = await api.get(`user/${selectedClinicianId}`);
    setClinicianHasLeave(
      user?.leaves?.some(
        leave =>
          new Date(leave.startDate) <= new Date(selectedDate) &&
          new Date(leave.endDate) >= new Date(selectedDate),
      ),
    );
  };

  const handleCheckAdditionalClinicianHasLeave = async () => {
    if (!selectedDate || !selectedAdditionalClinicianId) {
      setAdditionalClinicianHasLeave(false);
      return;
    }
    const user = await api.get(`user/${selectedAdditionalClinicianId}`);
    setAdditionalClinicianHasLeave(
      user?.leaves?.some(
        leave =>
          new Date(leave.startDate) <= new Date(selectedDate) &&
          new Date(leave.endDate) >= new Date(selectedDate),
      ),
    );
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
            onChange={() => resetFields(['endDate', 'endTime'])}
            data-testid="field-kwns"
          />
          <DateTimeRangeField
            onChangeStartDate={() => resetFields(['startTime'])}
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
                Clinician has leave scheduled on this date
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
              suggester={clinicianSuggester}
              onChange={e => setSelectedAdditionalClinicianId(e.target.value)}
              data-testid="field-additionalclinician"
            />
            {additionalClinicianHasLeave && (
              <BodyText marginTop={'4px'} color={Colors.midText}>
                Clinician has leave scheduled on this date
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
            component={MultiselectField}
            options={procedureTypeOptions}
            data-testid="field-proceduretype"
          />
          <Field
            name="encounterId"
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
