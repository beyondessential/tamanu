import React from 'react';
import { NavigationProp } from '@react-navigation/native';

import { DateField } from '../../DateField/DateField';
import { TextField } from '../../TextField/TextField';
import { Checkbox } from '../../Checkbox';
import { CurrentUserField } from '../../CurrentUserField/CurrentUserField';
import { Field } from '../FormField';
import { LocationField } from '../../LocationField';
import { INJECTION_SITE_OPTIONS, ReferenceDataType } from '~/types';
import { AutocompleteModalField } from '../../AutocompleteModal/AutocompleteModalField';
import { Dropdown, SuggesterDropdown } from '../../Dropdown';
import { Routes } from '~/ui/helpers/routes';
import { Suggester } from '~/ui/helpers/suggester';
import { useFacility } from '~/ui/contexts/FacilityContext';
import { useBackend } from '~/ui/hooks';

const InjectionSiteDropdown = ({ value, label, onChange, selectPlaceholderText }): JSX.Element => (
  <Dropdown
    value={value}
    options={INJECTION_SITE_OPTIONS.map(o => ({ label: o, value: o }))}
    onChange={onChange}
    label={label}
    selectPlaceholderText={selectPlaceholderText}
  />
);

interface LabelledFieldProps {
  label?: string;
  required?: boolean;
}

interface NavigationFieldProps {
  navigation: NavigationProp<any>;
}

export const DateGivenField = ({
  label = 'Date given',
  required = true,
}: LabelledFieldProps): JSX.Element => (
  <Field component={DateField} name="date" label={label} required={required} />
);

export const BatchField = (): JSX.Element => (
  <Field
    component={TextField}
    name="batch"
    label="Batch"
    labelFontSize="14"
    placeholder="Batch number"
  />
);

export const InjectionSiteField = (): JSX.Element => (
  <Field
    component={InjectionSiteDropdown}
    name="injectionSite"
    label="Injection site"
    selectPlaceholderText="Select"
  />
);

export const NotGivenReasonField = (): JSX.Element => (
  <Field
    component={SuggesterDropdown}
    name="notGivenReasonId"
    label="Reason"
    selectPlaceholderText="Select"
    referenceDataType={ReferenceDataType.VaccineNotGivenReason}
  />
);

export const VaccineLocationField = ({ navigation }: NavigationFieldProps): JSX.Element => (
  <LocationField navigation={navigation} required />
);

export const DepartmentField = ({ navigation }: NavigationFieldProps): JSX.Element => {
  const { models } = useBackend();
  const { facilityId } = useFacility();

  const departmentSuggester = new Suggester(models.Department, {
    where: {
      facility: facilityId,
    },
  });

  return (
    <Field
      component={AutocompleteModalField}
      navigation={navigation}
      suggester={departmentSuggester}
      name="departmentId"
      label="Department"
      placeholder="Search..."
      required
    />
  );
};

export const GivenByField = ({ label = 'Given by' }: LabelledFieldProps): JSX.Element => (
  <Field component={TextField} label={label} name="givenBy" labelFontSize="14" />
);

export const RecordedByField = (): JSX.Element => (
  <CurrentUserField label="Recorded by" name="recorderId" labelFontSize="14" />
);

export const ConsentField = (): JSX.Element => (
  <Field
    component={Checkbox}
    name="consent"
    label="Consent"
    text="Do you have consent from the recipient/parent/guardian to give this vaccine and record in Tamanu?"
    required
  />
);

export const ConsentGivenByField = (): JSX.Element => (
  <Field
    component={TextField}
    name="consentGivenBy"
    label="Consent given by"
    placeholder="Consent given by"
    labelFontSize="14"
  />
);
