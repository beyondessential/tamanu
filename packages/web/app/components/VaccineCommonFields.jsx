import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import Divider from '@mui/material/Divider';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { INJECTION_SITE_LABELS, VACCINE_CATEGORIES } from '@tamanu/constants';
import {
  AutocompleteField,
  BaseSelectField,
  DateTimeField,
  Field,
  FormSubmitCancelRow,
  OuterLabelFieldWrapper,
  SelectField,
  TextField,
  TranslatedSelectField,
  TranslatedText,
} from '@tamanu/ui-components';
import { useSuggester } from '../api';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { CheckField, LocalisedLocationField, RadioField } from './Field';

export const FullWidthCol = styled.div`
  grid-column: 1 / -1;
`;

export const StyledDivider = styled(Divider)`
  grid-column: 1 / -1;
`;

export const VerticalDivider = styled(Divider)`
  height: 50px;
  margin-left: 5px;
`;

const VACCINE_FIELD_CATEGORY_OPTIONS = /** @type {const} */ ([
  {
    value: VACCINE_CATEGORIES.ROUTINE,
    label: <TranslatedText stringId="vaccine.category.option.routine" fallback="Routine" />,
  },
  {
    value: VACCINE_CATEGORIES.CATCHUP,
    label: <TranslatedText stringId="vaccine.category.option.catchUp" fallback="Catch-up" />,
  },
  {
    value: VACCINE_CATEGORIES.CAMPAIGN,
    label: <TranslatedText stringId="vaccine.category.option.campaign" fallback="Campaign" />,
  },
  {
    value: VACCINE_CATEGORIES.OTHER,
    label: <TranslatedText stringId="vaccine.category.option.other" fallback="Other" />,
    leftOptionalElement: (
      <VerticalDivider orientation="vertical" data-testid="verticaldivider-n0cy" />
    ),
    style: { marginLeft: '15px' },
  },
]);

export const CategoryField = ({ setCategory, setVaccineLabel, resetForm }) => (
  <FullWidthCol data-testid="fullwidthcol-vxpe">
    <Field
      name="category"
      label={<TranslatedText stringId="vaccine.category.label" fallback="Category" />}
      component={RadioField}
      options={VACCINE_FIELD_CATEGORY_OPTIONS}
      onChange={e => {
        setCategory(e.target.value);
        setVaccineLabel(null);
        resetForm();
      }}
      required
      data-testid="field-rd4e"
    />
  </FullWidthCol>
);

export const VaccineLabelField = ({ vaccineOptions, setVaccineLabel }) => (
  <Field
    name="vaccineLabel"
    label={<TranslatedText stringId="vaccine.vaccine.label" fallback="Vaccine" />}
    component={SelectField}
    options={vaccineOptions}
    onChange={e => setVaccineLabel(e.target.value)}
    required
    data-testid="field-npct"
  />
);

export const BatchField = () => (
  <Field
    name="batch"
    label={<TranslatedText stringId="vaccine.batch.label" fallback="Batch" />}
    component={TextField}
    data-testid="field-865y"
  />
);

export const VaccineDateField = ({ label, required = true, min, max }) => (
  <Field
    name="date"
    label={label}
    component={DateTimeField}
    required={required}
    min={min}
    max={max}
    data-testid="field-8sou"
  />
);

export const InjectionSiteField = () => (
  <Field
    name="injectionSite"
    label={<TranslatedText stringId="vaccine.injectionSite.label" fallback="Injection site" />}
    component={TranslatedSelectField}
    enumValues={INJECTION_SITE_LABELS}
    data-testid="field-jz48"
  />
);

export const LocationField = () => (
  <Field
    name="locationId"
    component={LocalisedLocationField}
    enableLocationStatus={false}
    required
    data-testid="field-zrlv"
  />
);

export const DepartmentField = () => {
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  return (
    <Field
      name="departmentId"
      label={<TranslatedText stringId="general.department.label" fallback="Department" />}
      required
      component={AutocompleteField}
      suggester={departmentSuggester}
      data-testid="field-5sfc"
    />
  );
};

export const GivenByField = ({
  label = <TranslatedText stringId="vaccine.givenBy.label" fallback="Given by" />,
}) => <Field name="givenBy" label={label} component={TextField} data-testid="field-xycc" />;

export const GivenByCountryField = () => {
  const countrySuggester = useSuggester('country');

  return (
    <Field
      name="givenBy"
      label={<TranslatedText stringId="vaccine.country.label" fallback="Country" />}
      component={AutocompleteField}
      suggester={countrySuggester}
      required
      allowFreeTextForExistingValue
      data-testid="field-e5kc"
    />
  );
};

export const RecordedByField = () => {
  const { currentUser } = useAuth();

  return (
    <Field
      disabled
      name="recorderId"
      label={<TranslatedText stringId="vaccine.recordedBy.label" fallback="Recorded by" />}
      component={BaseSelectField}
      options={[
        {
          label: currentUser.displayName,
          value: currentUser.id,
        },
      ]}
      value={currentUser.id}
      data-testid="field-c1vf"
    />
  );
};

export const ConsentField = ({ label, ...props }) => (
  <FullWidthCol data-testid="fullwidthcol-q2z3">
    <OuterLabelFieldWrapper
      label={<TranslatedText stringId="vaccine.consent.label" fallback="Consent" />}
      style={{ marginBottom: '5px' }}
      required
      data-testid="outerlabelfieldwrapper-azty"
    />
    <Field name="consent" label={label} component={CheckField} required {...props} />
  </FullWidthCol>
);

export const ConsentGivenByField = () => (
  <Field
    name="consentGivenBy"
    label={<TranslatedText stringId="vaccine.consentGivenBy.label" fallback="Consent given by" />}
    component={TextField}
    data-testid="field-inc8"
  />
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

  return (
    scheduleOptions.length > 0 && (
      <FullWidthCol data-testid="fullwidthcol-3xje">
        <Field
          name="scheduledVaccineId"
          label={<TranslatedText stringId="vaccine.schedule.label" fallback="Schedule" />}
          component={RadioField}
          options={scheduleOptions}
          required
          autofillSingleAvailableOption
          data-testid="field-rggk"
        />
      </FullWidthCol>
    )
  );
};

export const VaccineNameField = () => (
  <Field
    name="vaccineName"
    label={<TranslatedText stringId="vaccine.vaccineName.label" fallback="Vaccine name" />}
    component={TextField}
    required
    data-testid="field-vaccineName"
  />
);

export const VaccineBrandField = () => (
  <Field
    name="vaccineBrand"
    label={<TranslatedText stringId="vaccine.vaccineBrand.label" fallback="Vaccine brand" />}
    component={TextField}
    data-testid="field-f1vm"
  />
);

export const DiseaseField = () => (
  <Field
    name="disease"
    label={<TranslatedText stringId="vaccine.disease.label" fallback="Disease" />}
    component={TextField}
    data-testid="field-gcfk"
  />
);

export const ConfirmCancelRowField = ({ onConfirm, onCancel, editMode = false }) => (
  <FormSubmitCancelRow
    onConfirm={onConfirm}
    onCancel={onCancel}
    confirmText={
      editMode ? <TranslatedText stringId="general.action.save" fallback="Save" /> : undefined
    }
    data-testid="formsubmitcancelrow-vv8q"
  />
);
