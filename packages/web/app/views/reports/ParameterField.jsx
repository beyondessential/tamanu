import React from 'react';
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
const useReportSuggesterOptions = (filterBySelectedFacility, suggesterOptions) => {
  const [{ value: facilityIdValue }] = useField('facilityId') || [{}];
  if (!filterBySelectedFacility || !facilityIdValue) return suggesterOptions;
  return {
    ...suggesterOptions,
    baseQueryParameters: { ...suggesterOptions?.baseQueryParameters, facilityId: facilityIdValue },
  };
};

const ParameterSuggesterSelectField = ({
  suggesterEndpoint,
  name,
  filterBySelectedFacility,
  ...props
}) => {
  const { baseQueryParameters } = useReportSuggesterOptions(filterBySelectedFacility, {});
  return (
    <Field
      component={SuggesterSelectField}
      endpoint={suggesterEndpoint}
      filterByFacility={filterBySelectedFacility}
      selectedFacilityId={baseQueryParameters?.facilityId}
      name={name}
      {...props}
    />
  );
};

const ParameterAutocompleteField = ({
  suggesterEndpoint,
  suggesterOptions,
  name,
  filterBySelectedFacility,
  ...props
}) => {
  const options = useReportSuggesterOptions(filterBySelectedFacility, suggesterOptions);
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
  parametersFilteredByFacility,
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
      parametersFilteredByFacility={parametersFilteredByFacility}
      {...props}
    />
  );
};
