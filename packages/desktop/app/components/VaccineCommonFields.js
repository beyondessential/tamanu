import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import { CheckCircleRounded } from '@material-ui/icons';

import { INJECTION_SITE_OPTIONS, VACCINE_CATEGORIES } from '@tamanu/constants';

import { OuterLabelFieldWrapper } from './Field/OuterLabelFieldWrapper';
import {
  Field,
  TextField,
  AutocompleteField,
  DateField,
  RadioField,
  SelectField,
  CheckField,
  LocalisedLocationField,
} from './Field';
import { ConfirmCancelRow } from './ButtonRow';
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
    label: <TranslatedText stringId="vaccine.form.category.option.routine" fallback="Routine" />,
  },
  {
    value: VACCINE_CATEGORIES.CATCHUP,
    label: <TranslatedText stringId="vaccine.form.category.option.catchUp" fallback="Catch-up" />,
  },
  {
    value: VACCINE_CATEGORIES.CAMPAIGN,
    label: <TranslatedText stringId="vaccine.form.category.option.campaign" fallback="Campaign" />,
  },
  {
    value: VACCINE_CATEGORIES.OTHER,
    label: <TranslatedText stringId="vaccine.form.category.option.other" fallback="Other" />,
    leftOptionalElement: <VerticalDivider orientation="vertical" />,
    style: { marginLeft: '15px' },
  },
];

const VACCINE_FIELD_INJECTION_SITE_OPTIONS = [
  {
    value: INJECTION_SITE_OPTIONS.LEFT_ARM,
    label: (
      <TranslatedText stringId="vaccine.form.injectionSite.option.leftArm" fallback="Left arm" />
    ),
  },
  {
    value: INJECTION_SITE_OPTIONS.RIGHT_ARM,
    label: (
      <TranslatedText stringId="vaccine.form.injectionSite.option.rightArm" fallback="Right arm" />
    ),
  },
  {
    value: INJECTION_SITE_OPTIONS.LEFT_THIGH,
    label: (
      <TranslatedText
        stringId="vaccine.form.injectionSite.option.leftThigh"
        fallback="Left thigh"
      />
    ),
  },
  {
    value: INJECTION_SITE_OPTIONS.RIGHT_THIGH,
    label: (
      <TranslatedText
        stringId="vaccine.form.injectionSite.option.rightThigh"
        fallback="Right thigh"
      />
    ),
  },
  {
    value: INJECTION_SITE_OPTIONS.ORAL,
    label: <TranslatedText stringId="vaccine.form.injectionSite.option.oral" fallback="Oral" />,
  },
  {
    value: INJECTION_SITE_OPTIONS.OTHER,
    label: <TranslatedText stringId="vaccine.form.injectionSite.option.Other" fallback="Other" />,
  },
];

export const CategoryField = ({ setCategory, setVaccineLabel, resetForm }) => (
  <FullWidthCol>
    <Field
      name="category"
      label={<TranslatedText stringId="vaccine.form.category.label" fallback="Category" />}
      component={RadioField}
      options={VACCINE_FIELD_CATEGORY_OPTIONS}
      onChange={e => {
        setCategory(e.target.value);
        setVaccineLabel(null);
        resetForm();
      }}
      required
    />
  </FullWidthCol>
);

export const VaccineLabelField = ({ vaccineOptions, setVaccineLabel }) => (
  <Field
    name="vaccineLabel"
    label={<TranslatedText stringId="vaccine.form.vaccine.label" fallback="Vaccine" />}
    component={SelectField}
    options={vaccineOptions}
    onChange={e => setVaccineLabel(e.target.value)}
    required
  />
);

export const BatchField = () => (
  <Field
    name="batch"
    label={<TranslatedText stringId="vaccine.form.batch.label" fallback="Batch" />}
    component={TextField}
  />
);

export const VaccineDateField = ({ label, required = true }) => (
  <Field name="date" label={label} component={DateField} required={required} saveDateAsString />
);

export const InjectionSiteField = () => (
  <Field
    name="injectionSite"
    label={<TranslatedText stringId="vaccine.form.injectionSite.label" fallback="Injection Site" />}
    component={SelectField}
    options={VACCINE_FIELD_INJECTION_SITE_OPTIONS}
  />
);

export const LocationField = () => (
  <Field
    name="locationId"
    component={LocalisedLocationField}
    enableLocationStatus={false}
    required
  />
);

export const DepartmentField = () => {
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  return (
    <Field
      name="departmentId"
      label={<TranslatedText stringId="general.form.department.label" fallback="Department" />}
      required
      component={AutocompleteField}
      suggester={departmentSuggester}
    />
  );
};

export const GivenByField = ({
  label = <TranslatedText stringId="vaccine.form.givenBy.label" fallback="Given by" />,
}) => <Field name="givenBy" label={label} component={TextField} />;

export const GivenByCountryField = () => {
  const countrySuggester = useSuggester('country');

  return (
    <Field
      name="givenBy"
      label={<TranslatedText stringId="vaccine.form.country.label" fallback="Country" />}
      component={AutocompleteField}
      suggester={countrySuggester}
      required
      allowFreeTextForExistingValue
    />
  );
};

export const RecordedByField = () => {
  const { currentUser } = useAuth();

  return (
    <Field
      disabled
      name="recorderId"
      label={<TranslatedText stringId="vaccine.form.recordedBy.label" fallback="Recorded by" />}
      component={SelectField}
      options={[
        {
          label: currentUser.displayName,
          value: currentUser.id,
        },
      ]}
      value={currentUser.id}
    />
  );
};

export const ConsentField = ({ label }) => (
  <FullWidthCol>
    <OuterLabelFieldWrapper
      label={<TranslatedText stringId="vaccine.form.consent.label" fallback="Consent" />}
      style={{ marginBottom: '5px' }}
      required
    />
    <Field name="consent" label={label} component={CheckField} required />
  </FullWidthCol>
);

export const ConsentGivenByField = () => (
  <Field
    name="consentGivenBy"
    label={
      <TranslatedText stringId="vaccine.form.consentGivenBy.label" fallback="Consent given by" />
    }
    component={TextField}
  />
);

export const AdministeredVaccineScheduleField = ({ schedules }) => {
  const [scheduleOptions, setScheduledOptions] = useState([]);
  useEffect(() => {
    const options =
      schedules?.map(s => ({
        value: s.scheduledVaccineId,
        label: s.schedule,
        icon: s.administered ? <CheckCircleRounded style={{ color: Colors.safe }} /> : null,
        disabled: s.administered,
      })) || [];
    setScheduledOptions(options);
  }, [schedules]);

  return (
    scheduleOptions.length > 0 && (
      <FullWidthCol>
        <Field
          name="scheduledVaccineId"
          label={<TranslatedText stringId="vaccine.form.schedule.label" fallback="Schedule" />}
          component={RadioField}
          options={scheduleOptions}
          required
          autofillSingleAvailableOption
        />
      </FullWidthCol>
    )
  );
};

export const VaccineNameField = () => (
  <Field
    name="vaccineName"
    label={<TranslatedText stringId="vaccine.form.vaccineName.label" fallback="Vaccine name" />}
    component={TextField}
    required
  />
);

export const VaccineBrandField = () => (
  <Field
    name="vaccineBrand"
    label={<TranslatedText stringId="vaccine.form.vaccineBrand.label" fallback="Vaccine brand" />}
    component={TextField}
  />
);

export const DiseaseField = () => (
  <Field
    name="disease"
    label={<TranslatedText stringId="vaccine.form.disease.label" fallback="Disease" />}
    component={TextField}
  />
);

export const ConfirmCancelRowField = ({ onConfirm, onCancel, editMode = false }) => (
  <ConfirmCancelRow
    onConfirm={onConfirm}
    onCancel={onCancel}
    confirmText={
      editMode ? <TranslatedText stringId="general.action.save" fallback="Save" /> : undefined
    }
  />
);
