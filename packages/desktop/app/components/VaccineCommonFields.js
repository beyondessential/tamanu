import React from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';

import {
  INJECTION_SITE_OPTIONS,
  VACCINE_CATEGORY_OPTIONS,
  VACCINE_CATEGORIES,
} from 'shared/constants';

import { OuterLabelFieldWrapper } from './Field/OuterLabelFieldWrapper';
import { AdministeredVaccineSchedule } from './AdministeredVaccineSchedule';
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

export const FullWidthCol = styled.div`
  grid-column: 1/-1;
`;

export const StyledDivider = styled(Divider)`
  grid-column: 1/-1;
`;

const VACCINE_FIELD_CATEGORY_OPTIONS = [
  ...VACCINE_CATEGORY_OPTIONS.filter(o => o.value !== VACCINE_CATEGORIES.OTHER),
  { value: VACCINE_CATEGORIES.OTHER, label: 'Other', style: { marginLeft: '15px' } },
];

export const CategoryField = ({ category, setCategory, setVaccineLabel }) => (
  <FullWidthCol>
    <Field
      name="category"
      label="Category"
      value={category}
      component={RadioField}
      options={VACCINE_FIELD_CATEGORY_OPTIONS}
      onChange={e => {
        setCategory(e.target.value);
        setVaccineLabel(null);
      }}
      required
    />
  </FullWidthCol>
);

export const VaccineLabelField = ({ vaccineLabel, vaccineOptions, setVaccineLabel }) => (
  <Field
    name="vaccineLabel"
    label="Vaccine"
    value={vaccineLabel}
    component={SelectField}
    options={vaccineOptions}
    onChange={e => setVaccineLabel(e.target.value)}
    required
  />
);

export const BatchField = () => <Field name="batch" label="Batch" component={TextField} />;

export const AdministeredOptionsField = ({ administeredOptions }) => (
  <div>
    <OuterLabelFieldWrapper label="Administered schedule" />
    {administeredOptions.map(option => (
      <AdministeredVaccineSchedule option={option} />
    ))}
  </div>
);

export const ScheduledOptionsField = ({ scheduleOptions }) => (
  <Field
    name="scheduledVaccineId"
    label="Available schedule"
    component={RadioField}
    options={scheduleOptions}
    required
  />
);

export const VaccineDateField = ({ label, required = true }) => (
  <Field name="date" label={label} component={DateField} required={required} saveDateAsString />
);

export const InjectionSiteField = () => (
  <Field
    name="injectionSite"
    label="Injection site"
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
      label="Department"
      required
      component={AutocompleteField}
      suggester={departmentSuggester}
    />
  );
};

export const GivenByField = ({ label = 'Given by' }) => (
  <Field name="givenBy" label={label} component={TextField} />
);

export const GivenByCountryField = () => {
  const countrySuggester = useSuggester('country');

  return (
    <Field
      name="givenBy"
      label="Country"
      component={AutocompleteField}
      suggester={countrySuggester}
      required
    />
  );
};

export const RecordedByField = () => {
  const { currentUser } = useAuth();

  return (
    <Field
      disabled
      name="recorderId"
      label="Recorded by"
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
    <OuterLabelFieldWrapper label="Consent" style={{ marginBottom: '5px' }} required />
    <Field name="consent" label={label} component={CheckField} required />
  </FullWidthCol>
);

export const ConsentGivenByField = () => (
  <Field name="consentGivenBy" label="Consent given by" component={TextField} />
);

export const AdministeredVaccineScheduleField = ({ administeredOptions, scheduleOptions }) => (
  <FullWidthCol>
    {administeredOptions.length > 0 && (
      <div>
        <OuterLabelFieldWrapper label="Administered schedule" />
        {administeredOptions.map(option => (
          <AdministeredVaccineSchedule option={option} />
        ))}
      </div>
    )}
    {scheduleOptions.length > 0 && (
      <Field
        name="scheduledVaccineId"
        label="Available schedule"
        component={RadioField}
        options={scheduleOptions}
        required
      />
    )}
  </FullWidthCol>
);

export const VaccineNameField = () => (
  <Field name="vaccineName" label="Vaccine name" component={TextField} required />
);

export const VaccineBrandField = () => (
  <Field name="vaccineBrand" label="Vaccine brand" component={TextField} />
);

export const DiseaseField = () => <Field name="disease" label="Disease" component={TextField} />;

export const ConfirmCancelRowField = ({
  onConfirm,
  category,
  scheduleOptions,
  onCancel,
  editMode,
}) => (
  <ConfirmCancelRow
    onConfirm={onConfirm}
    confirmDisabled={
      category !== VACCINE_CATEGORIES.OTHER && scheduleOptions.length === 0 && !editMode
    }
    onCancel={onCancel}
    confirmText={editMode ? 'Save' : undefined}
  />
);
