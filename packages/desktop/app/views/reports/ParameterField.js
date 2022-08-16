import React from 'react';
import styled from 'styled-components';
import { AutocompleteField, Field, SelectField, MultiselectField } from '../../components';
import { VillageField } from './VillageField';
import { LabTestLaboratoryField } from './LabTestLaboratoryField';
import { PractitionerField } from './PractitionerField';
import { DiagnosisField } from './DiagnosisField';
import { VaccineCategoryField } from './VaccineCategoryField';
import { VaccineField } from './VaccineField';
import { useSuggester } from '../../api';

const ParameterAutocompleteField = ({ suggesterEndpoint, ...props }) => {
  const suggester = useSuggester(suggesterEndpoint);
  return <Field component={AutocompleteField} suggester={suggester} {...props} />;
};

const ParameterSelectField = props => <Field component={SelectField} {...props} />;

const ParameterMultiselectField = props => <Field component={MultiselectField} {...props} />;

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
};

export const ParameterField = ({ parameterField, name, required, label, values, ...props }) => {
  const ParameterFieldComponent = PARAMETER_FIELD_COMPONENTS[parameterField];

  return (
    <ParameterFieldComponent
      key={name}
      required={required}
      name={name}
      label={label}
      parameterValues={values}
      {...props}
    />
  );
};
