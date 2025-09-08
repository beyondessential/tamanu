import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useField } from 'formik';

import {
  SUGGESTER_ENDPOINTS,
  SUGGESTER_ENDPOINTS_SUPPORTING_ALL,
} from '@tamanu/constants/suggesters';

import { useSuggester } from '../../api';
import { AutocompleteField, Field, SuggesterSelectField } from '../../components';
import { BaseSelectField, BaseMultiselectField } from '@tamanu/ui-components';
import { VillageField } from './VillageField';
import { LabTestLaboratoryField } from './LabTestLaboratoryField';
import { PractitionerField } from './PractitionerField';
import { DiagnosisField } from './DiagnosisField';
import { LabTestTypeField } from './LabTestTypeField';
import { LabTestCategoryField } from './LabTestCategoryField';
import { VaccineCategoryField } from './VaccineCategoryField';
import { ImagingTypeField } from './ImagingTypeField';
import { LabTestCategorySensitiveField } from './LabTestCategorySensitiveField';
import { AppointmentTypeField } from './AppointmentTypeField';
import { BookingTypeField } from './BookingTypeField';
import { VaccineField } from './VaccineField';
import { LocationField } from './LocationField';
import { FacilityField } from './FacilityField';
import { PatientField } from './PatientField';

export const FIELD_TYPES_TO_SUGGESTER_OPTIONS = {
  ParameterSuggesterSelectField: SUGGESTER_ENDPOINTS_SUPPORTING_ALL,
  ParameterAutocompleteField: SUGGESTER_ENDPOINTS,
};

export const FIELD_TYPES_WITH_SUGGESTERS = Object.keys(FIELD_TYPES_TO_SUGGESTER_OPTIONS);

export const FIELD_TYPES_WITH_PREDEFINED_OPTIONS = [
  'ParameterSelectField',
  'ParameterMultiselectField',
];

export const FIELD_TYPES_SUPPORTING_FILTER_BY_SELECTED_FACILITY = [
  'ParameterSuggesterSelectField',
  'ParameterAutocompleteField',
];

const useReportSuggesterOptions = (parameters, suggesterOptions = {}) => {
  // Get name of facility select field if it exists
  const facilityField = useMemo(
    () => parameters.find(param => param.parameterField === 'FacilityField'),
    [parameters],
  );
  const [{ value: facilityIdValue }] = useField(facilityField?.name || 'facilityId');
  if (!facilityField?.filterBySelectedFacility || !facilityIdValue) return suggesterOptions;
  return {
    ...suggesterOptions,
    baseQueryParameters: { ...suggesterOptions?.baseQueryParameters, facilityId: facilityIdValue },
  };
};

const ParameterSuggesterSelectField = ({ suggesterEndpoint, name, parameters, ...props }) => {
  const { baseQueryParameters } = useReportSuggesterOptions(parameters);
  return (
    <Field
      component={SuggesterSelectField}
      endpoint={suggesterEndpoint}
      baseQueryParameters={baseQueryParameters}
      name={name}
      {...props}
      data-testid="field-u0dj"
    />
  );
};

const ParameterAutocompleteField = ({
  suggesterEndpoint,
  suggesterOptions,
  name,
  parameters,
  ...props
}) => {
  const options = useReportSuggesterOptions(parameters, suggesterOptions);
  const suggester = useSuggester(suggesterEndpoint, options);
  return (
    <Field
      component={AutocompleteField}
      suggester={suggester}
      name={name}
      {...props}
      data-testid="field-fbkj"
    />
  );
};

const ParameterSelectField = ({ name, ...props }) => (
  <Field component={BaseSelectField} name={name} {...props} data-testid="field-ozoi" />
);

const ParameterMultiselectField = ({ name, ...props }) => (
  <Field component={BaseMultiselectField} name={name} {...props} data-testid="field-qy3y" />
);

const EmptyField = styled.div``;

export const PARAMETER_FIELD_COMPONENTS = {
  AppointmentTypeField,
  BookingTypeField,
  DiagnosisField,
  EmptyField,
  FacilityField,
  ImagingTypeField,
  LabTestCategoryField,
  LabTestCategorySensitiveField,
  LabTestLaboratoryField,
  LabTestTypeField,
  LocationField,
  ParameterAutocompleteField,
  ParameterMultiselectField,
  ParameterSelectField,
  ParameterSuggesterSelectField,
  PatientField,
  PractitionerField,
  VaccineCategoryField,
  VaccineField,
  VillageField,
};

export const ParameterField = ({
  parameterField,
  parameters,
  name,
  required,
  label,
  values,
  ...props
}) => {
  const ParameterFieldComponent = PARAMETER_FIELD_COMPONENTS[parameterField];

  return (
    <ParameterFieldComponent
      required={required}
      name={name}
      label={label}
      parameterValues={values}
      parameters={parameters}
      {...props}
      data-testid="parameterfieldcomponent-r4ff"
    />
  );
};
