import React from 'react';
import styled from 'styled-components';
import {
  AutocompleteField,
  Field,
  SelectField,
  MultiselectField,
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

const PARAMETER_FIELD_COMPONENTS = {
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
