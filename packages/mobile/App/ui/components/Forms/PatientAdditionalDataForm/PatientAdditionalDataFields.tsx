import React, { ReactElement, useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView } from '/styled/common';
import { TextField } from '../../TextField/TextField';
import { Dropdown } from '~/ui/components/Dropdown';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { Field } from '~/ui/components/Forms/FormField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { PatientFieldDefinitionComponents } from '~/ui/helpers/fieldComponents';
import { useBackend, useBackendEffect } from '~/ui/hooks';

import {
  getSuggester,
  plainFields,
  relationIdFields,
  relationIdFieldsProperties,
  selectFields,
  selectFieldsOptions,
} from './helpers';
import { getConfiguredPatientAdditionalDataFields } from '~/ui/helpers/patient';
import { ActivityIndicator } from 'react-native';

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

const CustomField = ({ fieldName, required }): ReactElement => {
  const { models } = useBackend();
  const [fieldDefinition, setFieldDefinition] = useState(null);

  useEffect(() => {
    const fetchFieldDefinition = async () => {
      const definition = await models.PatientFieldDefinition.findOne({
        where: { id: fieldName },
      });
      setFieldDefinition(definition);
    };

    fetchFieldDefinition();
  }, [fieldName, models]);

  if (!fieldDefinition) return <ActivityIndicator />;

  return (
    <Field
      name={fieldDefinition.id}
      label={fieldDefinition.name}
      component={PatientFieldDefinitionComponents[fieldDefinition.fieldType]}
      options={fieldDefinition.options
        ?.split(',')
        ?.map(option => ({ label: option, value: option }))}
      required={required}
    />
  );
};


function getComponentForField(fieldName: string, customFieldIds: string[]): React.FC<{ fieldName: string }> {
  if (plainFields.includes(fieldName)) {
    return PlainField;
  }
  if (selectFields.includes(fieldName)) {
    return SelectField;
  }
  if (relationIdFields.includes(fieldName)) {
    return RelationField;
  }
  if (customFieldIds.includes(fieldName)) {
    return CustomField;
  }
  // Shouldn't happen
  throw new Error(`Unexpected field ${fieldName} for patient additional data.`);
}

export const PatientAdditionalDataFields = ({ fields, showMandatory = true }): ReactElement => {
  const { getLocalisation } = useLocalisation(); 
  const [customFieldDefinitions, error, loading] = useBackendEffect(({ models }) =>
    models.PatientFieldDefinition.getRepository().find({
      select: ['id']
    }),
  );
  const customFieldIds = customFieldDefinitions?.map(({ id }) => id);

  const padFields = getConfiguredPatientAdditionalDataFields(fields, showMandatory, getLocalisation);

  if (loading) return [];

  return padFields.map(fieldName => {
    const Component = getComponentForField(fieldName, customFieldIds);
    return <Component fieldName={fieldName} key={fieldName} required={showMandatory} />;
  });
};
