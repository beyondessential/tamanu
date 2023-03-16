import React from 'react';
import styled from 'styled-components';
import Divider from '@material-ui/core/Divider';

import { INJECTION_SITE_OPTIONS, VACCINE_CATEGORY_OPTIONS } from 'shared/constants';

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
import { useSuggester } from '../api';
import { useAuth } from '../contexts/Auth';

export const FullWidthCol = styled.div`
  grid-column: 1/-1;
`;

export const StyledDivider = styled(Divider)`
  grid-column: 1/-1;
`;

export const CategoryField = ({ category, setCategory, setVaccineLabel }) => (
  <FullWidthCol>
    <Field
      name="category"
      label="Category"
      value={category}
      component={RadioField}
      options={VACCINE_CATEGORY_OPTIONS}
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

export const VaccineDateField = ({ label }) => (
  <Field name="date" label={label} component={DateField} required saveDateAsString />
);

export const InjectionSiteFIeld = () => (
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
  <Field name="locationId" component={LocalisedLocationField} required />
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

export const GivenByField = ({
  label = 'Given by',
  component = TextField,
  suggester,
  required,
}) => (
  <Field
    name="givenBy"
    label={label}
    component={component}
    suggester={suggester}
    required={required}
  />
);

export const RecordedByField = () => {
  const { currentUser } = useAuth();

  return (
    <Field
      disabled
      name="recorderId"
      label="Recorded By"
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

export const ConsentField = () => (
  <FullWidthCol>
    <OuterLabelFieldWrapper label="Consent" style={{ marginBottom: '5px' }} required />
    <Field
      name="consent"
      label="Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?"
      component={CheckField}
      required
    />
  </FullWidthCol>
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
