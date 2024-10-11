import React, { useMemo } from 'react';
import styled from 'styled-components';
import {
  SUGGESTER_ENDPOINTS,
  SUGGESTER_ENDPOINTS_SUPPORTING_ALL,
} from '@tamanu/constants/suggesters';
import {
  AutocompleteField,
  Field,
  BaseSelectField,
  BaseMultiselectField,
  SuggesterSelectField,
} from '../../components';
import { VillageField } from './VillageField';
import { LabTestLaboratoryField } from './LabTestLaboratoryField';
import { PractitionerField } from './PractitionerField';
import { DiagnosisField } from './DiagnosisField';
import { LabTestTypeField } from './LabTestTypeField';
import { LabTestCategoryField } from './LabTestCategoryField';
import { VaccineCategoryField } from './VaccineCategoryField';
import { ImagingTypeField } from './ImagingTypeField';
import { VaccineField } from './VaccineField';
import { useSuggester } from '../../api';
import { FacilityField } from './FacilityField';
import { useField } from 'formik';

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
  if (!facilityField || !facilityField.filterBySelectedFacility) return suggesterOptions;
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
  return <Field component={AutocompleteField} suggester={suggester} name={name} {...props} />;
};

const ParameterSelectField = ({ name, ...props }) => (
  <Field component={BaseSelectField} name={name} {...props} />
);

const ParameterMultiselectField = ({ name, ...props }) => (
  <Field component={BaseMultiselectField} name={name} {...props} />
);

const EmptyField = styled.div``;

export const PARAMETER_FIELD_COMPONENTS = {
  VillageField,
  LabTestLaboratoryField,
  PractitionerField,
  FacilityField,
  DiagnosisField,
  VaccineCategoryField,
  VaccineField,
  EmptyField,
  ParameterAutocompleteField,
  ParameterSelectField,
  ParameterMultiselectField,
  ImagingTypeField,
  LabTestCategoryField,
  ParameterSuggesterSelectField,
  LabTestTypeField,
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
    />
  );
};
