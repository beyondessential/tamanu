import React, { useEffect, useMemo, useState } from 'react';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';

import { SETTING_KEYS, VACCINE_CATEGORIES, VACCINE_RECORDING_TYPES, FORM_TYPES } from '@tamanu/constants';
import { ISO9075_DATE_FORMAT } from '@tamanu/utils/dateTime';
import { Form, useDateTimeFormat } from '@tamanu/ui-components';

import { REQUIRED_INLINE_ERROR_MESSAGE } from '../constants';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingIndicator } from '../components/LoadingIndicator';
import {
  VACCINE_GIVEN_INITIAL_VALUES,
  VACCINE_GIVEN_VALIDATION_SCHEMA,
  VaccineGivenForm,
} from './VaccineGivenForm';
import { VaccineNotGivenForm } from './VaccineNotGivenForm';
import { usePatientCurrentEncounterQuery } from '../api/queries';
import { useAuth } from '../contexts/Auth';
import { TranslatedText } from '../components/Translation/TranslatedText';
import { useSettings } from '../contexts/Settings';
import { usePatientDataQuery } from '../api/queries/usePatientDataQuery';
import { isAfter, isBefore, parse } from 'date-fns';
import { TranslatedReferenceData } from '../components/Translation';

const validateGivenElsewhereRequiredField = (status, givenElsewhere) =>
  (status === VACCINE_RECORDING_TYPES.GIVEN && !givenElsewhere) ||
  status === VACCINE_RECORDING_TYPES.NOT_GIVEN; // If NOT_GIVEN then do not care about givenElsewhere

const getInitialCategory = (editMode, existingValues) => {
  if (editMode)
    return existingValues?.vaccineName ? VACCINE_CATEGORIES.OTHER : VACCINE_CATEGORIES.ROUTINE;
  return existingValues?.category;
};

export const VaccineForm = ({
  onCancel,
  onSubmit,
  editMode = false,
  existingValues,
  patientId,
  getScheduledVaccines,
  vaccineRecordingType,
}) => {
  const { getSetting } = useSettings();
  const { getCurrentDateTimeString } = useDateTimeFormat();

  const [vaccineLabel, setVaccineLabel] = useState(existingValues?.vaccineLabel);
  const [category, setCategory] = useState(getInitialCategory(editMode, existingValues));
  const [vaccineOptions, setVaccineOptions] = useState([]);

  const {
    data: patientData,
    isLoading: isLoadingPatientData,
    error: patientDataError,
  } = usePatientDataQuery(patientId);
  const {
    data: currentEncounter,
    isLoading: isLoadingCurrentEncounter,
    error: currentEncounterError,
  } = usePatientCurrentEncounterQuery(patientId);

  const vaccinationDefaults = getSetting(SETTING_KEYS.VACCINATION_DEFAULTS);
  const vaccineConsentEnabled = getSetting('features.enableVaccineConsent');

  const selectedVaccine = useMemo(
    () => vaccineOptions.find((v) => v.value === vaccineLabel),
    [vaccineLabel, vaccineOptions],
  );

  const { currentUser } = useAuth();

  useEffect(() => {
    if (!editMode) {
      const fetchScheduledVaccines = async () => {
        if (!category || category === VACCINE_CATEGORIES.OTHER) {
          setVaccineOptions([]);
          return;
        }
        const availableScheduledVaccines = await getScheduledVaccines({ category });
        setVaccineOptions(
          availableScheduledVaccines.map((vaccine) => ({
            label: (
              <TranslatedReferenceData
                fallback={vaccine.label}
                value={vaccine.id}
                category="scheduledVaccine"
                data-testid={`translatedreferencedata-e94b-${vaccine.code}`}
              />
            ),
            value: vaccine.label,
            schedules: vaccine.schedules,
          })),
        );
      };

      fetchScheduledVaccines();
    }
  }, [category, getScheduledVaccines, editMode]);

  if (isLoadingCurrentEncounter || isLoadingPatientData) {
    return <LoadingIndicator data-testid="loadingindicator-dpow" />;
  }

  if (currentEncounterError || isLoadingPatientData) {
    return (
      <ErrorMessage
        title={
          <TranslatedText
            stringId="vaccine.loadError"
            fallback="Cannot load vaccine form"
            data-testid="translatedtext-eumt"
          />
        }
        errorMessage={currentEncounterError?.message || patientDataError?.message}
        data-testid="errormessage-9m9j"
      />
    );
  }

  const BASE_VACCINE_SCHEME_VALIDATION = yup.object().shape({
    date: yup
      .string()
      .when(['status', 'givenElsewhere'], {
        is: validateGivenElsewhereRequiredField,
        then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
        otherwise: yup.string().nullable(),
      })
      .test(
        'min',
        <TranslatedText
          stringId="vaccine.minDateError"
          fallback="Date cannot be prior to patient date of birth"
          data-testid="translatedtext-nkib"
        />,
        (value, context) => {
          if (!value) return true;
          const minDate = parse(
            context.parent?.patientData?.dateOfBirth,
            ISO9075_DATE_FORMAT,
            new Date(),
          );
          const date = parse(value, ISO9075_DATE_FORMAT, new Date());
          if (isBefore(date, minDate)) {
            return false;
          }
          return true;
        },
      )
      .test(
        'max',
        <TranslatedText
          stringId="vaccine.maxDateError"
          fallback="Date cannot be in the future"
          data-testid="translatedtext-rure"
        />,
        (value) => {
          if (!value) return true;
          const maxDate = new Date();
          const date = parse(value, ISO9075_DATE_FORMAT, new Date());
          if (isAfter(date, maxDate)) {
            return false;
          }
          return true;
        },
      ),
    locationId: yup.string().when(['status', 'givenElsewhere'], {
      is: validateGivenElsewhereRequiredField,
      then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
      otherwise: yup.string().nullable(),
    }),
    departmentId: yup.string().when(['status', 'givenElsewhere'], {
      is: validateGivenElsewhereRequiredField,
      then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
      otherwise: yup.string().nullable(),
    }),
  });

  const NEW_RECORD_VACCINE_SCHEME_VALIDATION = BASE_VACCINE_SCHEME_VALIDATION.shape({
    category: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
    vaccineLabel: yup.string().when('category', {
      is: (categoryValue) => !!categoryValue && categoryValue !== VACCINE_CATEGORIES.OTHER,
      then: yup.string().nullable().required(REQUIRED_INLINE_ERROR_MESSAGE),
      otherwise: yup.string().nullable(),
    }),
    vaccineName: yup.string().when('category', {
      is: VACCINE_CATEGORIES.OTHER,
      then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
      otherwise: yup.string().nullable(),
    }),
    scheduledVaccineId: yup.string().when('category', {
      is: (categoryValue) => categoryValue !== VACCINE_CATEGORIES.OTHER,
      then: yup.string().required(REQUIRED_INLINE_ERROR_MESSAGE),
      otherwise: yup.string().nullable(),
    }),
  });

  const baseSchemeValidation = editMode
    ? BASE_VACCINE_SCHEME_VALIDATION
    : NEW_RECORD_VACCINE_SCHEME_VALIDATION;

  const initialValues = !editMode
    ? {
        status: vaccineRecordingType,
        vaccineLabel,
        category,
        scheduledVaccineId: existingValues?.scheduledVaccineId,
        date: getCurrentDateTimeString(),
        locationGroupId: !currentEncounter
          ? vaccinationDefaults?.locationGroupId
          : currentEncounter.location?.locationGroup?.id,
        locationId: !currentEncounter
          ? vaccinationDefaults?.locationId
          : currentEncounter.location?.id,
        departmentId: !currentEncounter
          ? vaccinationDefaults?.departmentId
          : currentEncounter.department?.id,
        ...(vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN
          ? VACCINE_GIVEN_INITIAL_VALUES
          : {}),
        patientData,
      }
    : {
        ...existingValues,
        ...(existingValues.circumstanceIds
          ? { circumstanceIds: JSON.stringify(existingValues.circumstanceIds) }
          : {}),
        patientData,
      };

  return (
    <Form
      onSubmit={async (data) => onSubmit({ ...data, category })}
      showInlineErrorsOnly
      initialValues={initialValues}
      formType={editMode ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={baseSchemeValidation.shape({
        ...(vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN &&
          VACCINE_GIVEN_VALIDATION_SCHEMA(vaccineConsentEnabled)),
      })}
      render={({ submitForm, resetForm, setErrors, values, setValues }) => (
        <VaccineFormComponent
          vaccineRecordingType={vaccineRecordingType}
          submitForm={submitForm}
          resetForm={resetForm}
          setErrors={setErrors}
          editMode={editMode}
          values={values}
          setValues={setValues}
          vaccineLabel={vaccineLabel}
          vaccineOptions={vaccineOptions}
          category={category}
          setCategory={setCategory}
          setVaccineLabel={setVaccineLabel}
          schedules={selectedVaccine?.schedules}
          onCancel={onCancel}
          currentUser={currentUser}
          vaccineConsentEnabled={vaccineConsentEnabled}
          initialValues={initialValues}
          data-testid="vaccineformcomponent-djg3"
        />
      )}
      data-testid="form-c1bs"
    />
  );
};

const VaccineFormComponent = ({
  vaccineRecordingType,
  submitForm,
  resetForm,
  setErrors,
  values,
  setValues,
  patientId,
  initialValues,
  ...props
}) => {
  const [prevVaccineRecordingType, setPrevVaccineRecordingType] = useState(vaccineRecordingType);

  const { setCategory, editMode } = props;
  useEffect(() => {
    // Reset the entire form values when switching between GIVEN and NOT_GIVEN tab
    if (prevVaccineRecordingType !== vaccineRecordingType) {
      resetForm({ values: initialValues });
      if (!editMode) {
        setCategory(VACCINE_CATEGORIES.ROUTINE);
      } // we strictly only want to reset the form values when vaccineRecordingType is changed
    }
    // Keep track of the previous vaccineRecordingType - this avoids the form being reset on initial load
    setPrevVaccineRecordingType(vaccineRecordingType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaccineRecordingType]);

  return vaccineRecordingType === VACCINE_RECORDING_TYPES.GIVEN ? (
    <VaccineGivenForm
      {...props}
      resetForm={resetForm}
      setErrors={setErrors}
      submitForm={submitForm}
      values={values}
      patientId={patientId}
      setValues={setValues}
      data-testid="vaccinegivenform-8mmv"
    />
  ) : (
    <VaccineNotGivenForm
      {...props}
      resetForm={resetForm}
      submitForm={submitForm}
      values={values}
      data-testid="vaccinenotgivenform-8wpb"
    />
  );
};

VaccineForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  patientId: PropTypes.string.isRequired,
  getScheduledVaccines: PropTypes.func.isRequired,
  vaccineRecordingType: PropTypes.string.isRequired,
};
