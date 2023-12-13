import {
  SUGGESTER_ENDPOINTS,
  SUGGESTER_ENDPOINTS_SUPPORTING_ALL,
} from '@tamanu/constants/suggesters';
import React from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../api';
import {
  AutocompleteField,
  Field,
  MultiselectField,
  SelectField,
  SuggesterSelectField,
} from '../../components';
import { DiagnosisField } from './DiagnosisField';
import { ImagingTypeField } from './ImagingTypeField';
import { LabTestCategoryField } from './LabTestCategoryField';
import { LabTestLaboratoryField } from './LabTestLaboratoryField';
import { LabTestTypeField } from './LabTestTypeField';
import { PractitionerField } from './PractitionerField';
import { VaccineCategoryField } from './VaccineCategoryField';
import { VaccineField } from './VaccineField';
import { VillageField } from './VillageField';

export const FIELD_TYPES_TO_SUGGESTER_OPTIONS = {
  ParameterSuggesterSelectField: SUGGESTER_ENDPOINTS_SUPPORTING_ALL,
  ParameterAutocompleteField: SUGGESTER_ENDPOINTS,
};

export const FIELD_TYPES_WITH_SUGGESTERS = Object.keys(FIELD_TYPES_TO_SUGGESTER_OPTIONS);

export const FIELD_TYPES_WITH_PREDEFINED_OPTIONS = [
  'ParameterSelectField',
  'ParameterMultiselectField',
];

const ParameterSuggesterSelectField = ({ suggesterEndpoint, name, ...props }) => (
  <Field component={SuggesterSelectField} endpoint={suggesterEndpoint} name={name} {...props} />
);

const ParameterAutocompleteField = ({ suggesterEndpoint, suggesterOptions, name, ...props }) => {
  const suggester = useSuggester(suggesterEndpoint, suggesterOptions);
  return <Field component={AutocompleteField} suggester={suggester} name={name} {...props} />;
};

const ParameterSelectField = ({ name, ...props }) => (
  <Field component={SelectField} name={name} {...props} />
);

const ParameterMultiselectField = ({ name, ...props }) => (
  <Field component={MultiselectField} name={name} {...props} />
);

const EmptyField = styled.div``;

export const PARAMETER_FIELD_COMPONENTS = {
  VillageField,
  LabTestLaboratoryField,
  PractitionerField,
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

export const ParameterField = ({ parameterField, name, required, label, values, ...props }) => {
  const ParameterFieldComponent = PARAMETER_FIELD_COMPONENTS[parameterField];

  return (
    <ParameterFieldComponent
      required={required}
      name={name}
      label={label}
      parameterValues={values}
      {...props}
    />
  );
};
