import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';
import { CheckCircleRounded } from '@material-ui/icons';

import {
  INJECTION_SITE_OPTIONS,
  VACCINE_CATEGORY_OPTIONS,
  VACCINE_CATEGORIES,
} from '@tamanu/constants';

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
  ...VACCINE_CATEGORY_OPTIONS.filter(o => o.value !== VACCINE_CATEGORIES.OTHER),
  {
    value: VACCINE_CATEGORIES.OTHER,
    label: <TranslatedText stringId="form.vaccines.categoryOther.label" fallback="Other" />,
    leftOptionalElement: <VerticalDivider orientation="vertical" />,
    style: { marginLeft: '15px' },
  },
];

export const CategoryField = ({ setCategory, setVaccineLabel, resetForm }) => (
  <FullWidthCol>
    <Field
      name="category"
      label={<TranslatedText stringId="form.vaccines.category.label" fallback="Category" />}
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
    label={<TranslatedText stringId="form.vaccines.vaccine.label" fallback="Vaccine" />}
    component={SelectField}
    options={vaccineOptions}
    onChange={e => setVaccineLabel(e.target.value)}
    required
  />
);

export const BatchField = () => (
  <Field
    name="batch"
    label={<TranslatedText stringId="form.vaccines.batch.label" fallback="Batch" />}
    component={TextField}
  />
);

export const VaccineDateField = ({ label, required = true }) => (
  <Field name="date" label={label} component={DateField} required={required} saveDateAsString />
);

export const InjectionSiteField = () => (
  <Field
    name="injectionSite"
    label={<TranslatedText stringId="form.vaccines.injectionSite.label" fallback="Injection Site" />}
    component={SelectField}
    options={Object.values(INJECTION_SITE_OPTIONS).map(site => ({
      label: site,
      value: site,
    }))}
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
      label={<TranslatedText stringId="form.vaccines.department.label" fallback="Department" />}
      required
      component={AutocompleteField}
      suggester={departmentSuggester}
    />
  );
};

export const GivenByField = ({
  label = <TranslatedText stringId="form.vaccines.givenBy.label" fallback="Given by" />,
}) => <Field name="givenBy" label={label} component={TextField} />;

export const GivenByCountryField = () => {
  const countrySuggester = useSuggester('country');

  return (
    <Field
      name="givenBy"
      label={<TranslatedText stringId="form.vaccines.country.label" fallback="Country" />}
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
      label={<TranslatedText stringId="form.vaccines.recordedBy.label" fallback="Recorded by" />}
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
      label={<TranslatedText stringId="form.vaccines.consent.label" fallback="Consent" />}
      style={{ marginBottom: '5px' }}
      required
    />
    <Field name="consent" label={label} component={CheckField} required />
  </FullWidthCol>
);

export const ConsentGivenByField = () => (
  <Field
    name="consentGivenBy"
    label={<TranslatedText stringId="form.vaccines.consentGivenBy.label" fallback="Consent given by" />}
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
          label={<TranslatedText stringId="form.vaccines.schedule.label" fallback="Schedule" />}
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
    label={<TranslatedText stringId="form.vaccines.vaccineName.label" fallback="Vaccine name" />}
    component={TextField}
    required
  />
);

export const VaccineBrandField = () => (
  <Field
    name="vaccineBrand"
    label={<TranslatedText stringId="form.vaccines.vaccineBrand.label" fallback="Vaccine brand" />}
    component={TextField}
  />
);

export const DiseaseField = () => (
  <Field
    name="disease"
    label={<TranslatedText stringId="form.vaccines.disease.label" fallback="Disease" />}
    component={TextField}
  />
);

export const ConfirmCancelRowField = ({ onConfirm, onCancel, editMode = false }) => (
  <ConfirmCancelRow
    onConfirm={onConfirm}
    onCancel={onCancel}
    confirmText={
      editMode ? <TranslatedText stringId="general.actions.save" fallback="Save" /> : undefined
    }
  />
);
