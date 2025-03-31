import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import { CheckCircleRounded } from '@material-ui/icons';

import { VACCINE_CATEGORIES, INJECTION_SITE_LABELS } from '@tamanu/constants';

import { OuterLabelFieldWrapper } from './Field/OuterLabelFieldWrapper';
import {
  AutocompleteField,
  CheckField,
  DateField,
  Field,
  LocalisedLocationField,
  RadioField,
  SelectField,
  TextField,
  BaseSelectField,
  TranslatedSelectField,
} from './Field';
import { FormSubmitCancelRow } from './ButtonRow';
import { useSuggester } from '../api';
import { useAuth } from '../contexts/Auth';
import { Colors } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';

export const FullWidthCol = styled.div`
  grid-column: 1/-1;
`;

export const StyledDivider = styled(Divider)`
  grid-column: 1/-1;
`;

export const VerticalDivider = styled(Divider)`
  height: 50px;
  margin-left: 5px;
`;

const VACCINE_FIELD_CATEGORY_OPTIONS = [
  {
    value: VACCINE_CATEGORIES.ROUTINE,
    label: <TranslatedText
      stringId="vaccine.category.option.routine"
      fallback="Routine"
      data-testid='translatedtext-d80r' />,
  },
  {
    value: VACCINE_CATEGORIES.CATCHUP,
    label: <TranslatedText
      stringId="vaccine.category.option.catchUp"
      fallback="Catch-up"
      data-testid='translatedtext-y4va' />,
  },
  {
    value: VACCINE_CATEGORIES.CAMPAIGN,
    label: <TranslatedText
      stringId="vaccine.category.option.campaign"
      fallback="Campaign"
      data-testid='translatedtext-vojj' />,
  },
  {
    value: VACCINE_CATEGORIES.OTHER,
    label: <TranslatedText
      stringId="vaccine.category.option.other"
      fallback="Other"
      data-testid='translatedtext-5reo' />,
    leftOptionalElement: <VerticalDivider orientation="vertical" />,
    style: { marginLeft: '15px' },
  },
];

export const CategoryField = ({ setCategory, setVaccineLabel, resetForm }) => (
  <FullWidthCol>
    <Field
      name="category"
      label={<TranslatedText
        stringId="vaccine.category.label"
        fallback="Category"
        data-testid='translatedtext-b27c' />}
      component={RadioField}
      options={VACCINE_FIELD_CATEGORY_OPTIONS}
      onChange={e => {
        setCategory(e.target.value);
        setVaccineLabel(null);
        resetForm();
      }}
      required
      data-testid='field-gt29' />
  </FullWidthCol>
);

export const VaccineLabelField = ({ vaccineOptions, setVaccineLabel }) => (
  <Field
    name="vaccineLabel"
    label={<TranslatedText
      stringId="vaccine.vaccine.label"
      fallback="Vaccine"
      data-testid='translatedtext-wpda' />}
    component={SelectField}
    options={vaccineOptions}
    onChange={e => setVaccineLabel(e.target.value)}
    required
    data-testid='field-7s2g' />
);

export const BatchField = () => (
  <Field
    name="batch"
    label={<TranslatedText
      stringId="vaccine.batch.label"
      fallback="Batch"
      data-testid='translatedtext-7crb' />}
    component={TextField}
    data-testid='field-5905' />
);

export const VaccineDateField = ({ label, required = true, min, max, keepIncorrectValue }) => (
  <Field
    name="date"
    label={label}
    component={DateField}
    required={required}
    saveDateAsString
    min={min}
    max={max}
    keepIncorrectValue={keepIncorrectValue}
    data-testid='field-efdt' />
);

export const InjectionSiteField = () => (
  <Field
    name="injectionSite"
    label={<TranslatedText
      stringId="vaccine.injectionSite.label"
      fallback="Injection site"
      data-testid='translatedtext-5eyg' />}
    component={TranslatedSelectField}
    enumValues={INJECTION_SITE_LABELS}
    data-testid='field-suzz' />
);

export const LocationField = () => (
  <Field
    name="locationId"
    component={LocalisedLocationField}
    enableLocationStatus={false}
    required
    data-testid='field-08dm' />
);

export const DepartmentField = () => {
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  return (
    <Field
      name="departmentId"
      label={<TranslatedText
        stringId="general.department.label"
        fallback="Department"
        data-testid='translatedtext-z9ov' />}
      required
      component={AutocompleteField}
      suggester={departmentSuggester}
      data-testid='field-dub3' />
  );
};

export const GivenByField = ({
  label = <TranslatedText
    stringId="vaccine.givenBy.label"
    fallback="Given by"
    data-testid='translatedtext-8nlc' />,
}) => <Field
  name="givenBy"
  label={label}
  component={TextField}
  data-testid='field-ojcj' />;

export const GivenByCountryField = () => {
  const countrySuggester = useSuggester('country');

  return (
    <Field
      name="givenBy"
      label={<TranslatedText
        stringId="vaccine.country.label"
        fallback="Country"
        data-testid='translatedtext-x82d' />}
      component={AutocompleteField}
      suggester={countrySuggester}
      required
      allowFreeTextForExistingValue
      data-testid='field-zpgo' />
  );
};

export const RecordedByField = () => {
  const { currentUser } = useAuth();

  return (
    <Field
      disabled
      name="recorderId"
      label={<TranslatedText
        stringId="vaccine.recordedBy.label"
        fallback="Recorded by"
        data-testid='translatedtext-oe8p' />}
      component={BaseSelectField}
      options={[
        {
          label: currentUser.displayName,
          value: currentUser.id,
        },
      ]}
      value={currentUser.id}
      data-testid='field-rbd8' />
  );
};

export const ConsentField = ({ label }) => (
  <FullWidthCol>
    <OuterLabelFieldWrapper
      label={<TranslatedText
        stringId="vaccine.consent.label"
        fallback="Consent"
        data-testid='translatedtext-h7iv' />}
      style={{ marginBottom: '5px' }}
      required
    />
    <Field
      name="consent"
      label={label}
      component={CheckField}
      required
      data-testid='field-bpc0' />
  </FullWidthCol>
);

export const ConsentGivenByField = () => (
  <Field
    name="consentGivenBy"
    label={<TranslatedText
      stringId="vaccine.consentGivenBy.label"
      fallback="Consent given by"
      data-testid='translatedtext-lxa0' />}
    component={TextField}
    data-testid='field-s7ja' />
);

export const AdministeredVaccineScheduleField = ({ schedules }) => {
  const [scheduleOptions, setScheduledOptions] = useState([]);
  useEffect(() => {
    const options =
      schedules?.map(s => ({
        value: s.scheduledVaccineId,
        label: s.doseLabel,
        icon: s.administered ? <CheckCircleRounded style={{ color: Colors.safe }} /> : null,
        disabled: s.administered,
      })) || [];
    setScheduledOptions(options);
  }, [schedules]);

  return (scheduleOptions.length > 0 && (<FullWidthCol>
    <Field
      name="scheduledVaccineId"
      label={<TranslatedText
        stringId="vaccine.schedule.label"
        fallback="Schedule"
        data-testid='translatedtext-sphp' />}
      component={RadioField}
      options={scheduleOptions}
      required
      autofillSingleAvailableOption
      data-testid='field-916a' />
  </FullWidthCol>));
};

export const VaccineNameField = () => (
  <Field
    name="vaccineName"
    label={<TranslatedText
      stringId="vaccine.vaccineName.label"
      fallback="Vaccine name"
      data-testid='translatedtext-bg2k' />}
    component={TextField}
    required
    data-testid='field-tzsi' />
);

export const VaccineBrandField = () => (
  <Field
    name="vaccineBrand"
    label={<TranslatedText
      stringId="vaccine.vaccineBrand.label"
      fallback="Vaccine brand"
      data-testid='translatedtext-kbgz' />}
    component={TextField}
    data-testid='field-315m' />
);

export const DiseaseField = () => (
  <Field
    name="disease"
    label={<TranslatedText
      stringId="vaccine.disease.label"
      fallback="Disease"
      data-testid='translatedtext-f89x' />}
    component={TextField}
    data-testid='field-83iz' />
);

export const ConfirmCancelRowField = ({ onConfirm, onCancel, editMode = false }) => (
  <FormSubmitCancelRow
    onConfirm={onConfirm}
    onCancel={onCancel}
    confirmText={
      editMode ? <TranslatedText
        stringId="general.action.save"
        fallback="Save"
        data-testid='translatedtext-5acw' /> : undefined
    }
    data-testid='formsubmitcancelrow-yk22' />
);
