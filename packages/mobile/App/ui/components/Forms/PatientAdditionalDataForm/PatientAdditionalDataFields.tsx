import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView } from '/styled/common';
import { TextField } from '../../TextField/TextField';
import { Dropdown } from '~/ui/components/Dropdown';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { Field } from '~/ui/components/Forms/FormField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { PatientFieldDefinitionComponents } from '~/ui/helpers/fieldComponents';
import { useBackend } from '~/ui/hooks';

import {
  plainFields,
  selectFields,
  selectFieldsOptions,
  relationIdFields,
  relationIdFieldsProperties,
  getSuggester,
} from './helpers';
import { getConfiguredPatientAdditionalDataFields } from '~/ui/helpers/patient';

const PlainField = ({ fieldName, required }): ReactElement => (
  // Outter styled view to momentarily add distance between fields
  <StyledView key={fieldName} paddingTop={15}>
    <LocalisedField name={fieldName} component={TextField} required={required} />
  </StyledView>
);

const SelectField = ({ fieldName, required }): ReactElement => (
  <LocalisedField
    key={fieldName}
    name={fieldName}
    options={selectFieldsOptions[fieldName]}
    component={Dropdown}
    required={required}
  />
);

const RelationField = ({ fieldName, required }): ReactElement => {
  const { models } = useBackend();
  const { getString } = useLocalisation();
  const navigation = useNavigation();
  const { type, placeholder } = relationIdFieldsProperties[fieldName];
  const localisedPlaceholder = getString(`fields.${fieldName}.longLabel`, placeholder);
  const suggester = getSuggester(models, type);

  return (
    <LocalisedField
      key={fieldName}
      component={AutocompleteModalField}
      placeholder={`Search for ${localisedPlaceholder}`}
      navigation={navigation}
      suggester={suggester}
      name={fieldName}
      required={required}
    />
  );
};

function getComponentForField(fieldName: string): React.FC<{ fieldName: string }> {
  if (plainFields.includes(fieldName)) {
    return PlainField;
  }
  if (selectFields.includes(fieldName)) {
    return SelectField;
  }
  if (relationIdFields.includes(fieldName)) {
    return RelationField;
  }
  // Shouldn't happen
  throw new Error(`Unexpected field ${fieldName} for patient additional data.`);
}

const getFieldComponent = fieldName => {
  const Component = getComponentForField(fieldName);
  return <Component fieldName={fieldName} key={fieldName} />;
}

const getCustomFieldComponent = ({ id, name, options, fieldType }) => {
  return <Field
    name={id}
    label={name}
    component={PatientFieldDefinitionComponents[fieldType]}
    options={options?.split(',')?.map(option => ({ label: option, value: option })}
  />;
}

export const PatientAdditionalDataFields = ({
  fields,
  isCustomFields,
  showMandatory = true,
}): ReactElement => {

  const { getBool } = useLocalisation();

  if (isCustomFields) return fields.map(getCustomFieldComponent);

  const nonRequiredPADFields = getConfiguredPatientAdditionalDataFields(
    fields,
    showMandatory,
    getBool,
  );

  return nonRequiredPADFields.map(getFieldComponent);
};
