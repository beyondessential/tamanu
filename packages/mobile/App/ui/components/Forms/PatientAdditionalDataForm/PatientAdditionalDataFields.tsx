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
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { HierarchyFields } from '../../HierarchyFields';
import { CAMBODIA_LOCATION_HIERARCHY_FIELDS } from '~/ui/navigation/screens/home/PatientDetails/layouts/cambodia/fields';
import { isObject, isString } from 'lodash';
import { labels } from '~/ui/navigation/screens/home/PatientDetails/layouts/generic/labels';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';

const PlainField = ({ fieldName, required }): ReactElement => (
  // Outter styled view to momentarily add distance between fields
  <StyledView key={fieldName} paddingTop={15}>
    <LocalisedField
      label={labels[fieldName]}
      name={fieldName}
      component={TextField}
      required={required}
    />
  </StyledView>
);

const SelectField = ({ fieldName, required }): ReactElement => (
  <LocalisedField
    key={fieldName}
    name={fieldName}
    label={labels[fieldName]}
    options={selectFieldsOptions[fieldName]}
    component={Dropdown}
    required={required}
  />
);

const RelationField = ({ fieldName, required }): ReactElement => {
  const { models } = useBackend();
  const { getTranslation } = useTranslation();
  const navigation = useNavigation();
  const { type, placeholder } = relationIdFieldsProperties[fieldName];
  const localisedPlaceholder = getTranslation(
    `general.localisedField.${fieldName}.label`,
    placeholder,
  );
  const suggester = getSuggester(models, type);

  return (
    <LocalisedField
      key={fieldName}
      label={labels[fieldName]}
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
  const [fieldDefinition, _, loading] = useBackendEffect(({ models }) =>
    models.PatientFieldDefinition.findOne({
      where: { id: fieldName },
    }),
  );

  if (loading) return <ActivityIndicator />;

  return getCustomFieldComponent(fieldDefinition, required);
};

const getCustomFieldComponent = (
  { id, name, options, fieldType }: PatientFieldDefinition,
  required?: boolean,
) => {
  return (
    <Field
      name={id}
      label={name}
      component={PatientFieldDefinitionComponents[fieldType]}
      options={options?.split(',')?.map(option => ({ label: option, value: option }))}
      required={required}
    />
  );
};

function getComponentForField(
  fieldName: string,
  customFieldIds: string[],
): React.FC<{ fieldName: string; required: boolean }> {
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

interface PatientAdditionalDataFieldsProps {
  fields: (string | PatientFieldDefinition)[];
  isCustomSection?: boolean;
  showMandatory?: boolean;
}

export const PatientAdditionalDataFields = ({
  fields,
  isCustomSection,
  showMandatory = true,
}: PatientAdditionalDataFieldsProps): ReactElement[] => {
  const { getLocalisation } = useLocalisation();
  const isHardCodedLayout = getLocalisation('layouts.patientDetails') !== 'generic';
  const [customFieldDefinitions, _, loading] = useBackendEffect(({ models }) =>
    models.PatientFieldDefinition.getRepository().find({
      select: ['id'],
    }),
  );
  const customFieldIds = customFieldDefinitions?.map(({ id }) => id);

  const padFields = isHardCodedLayout
    ? fields
    : getConfiguredPatientAdditionalDataFields(fields as string[], showMandatory, getLocalisation);

  if (isCustomSection)
    return fields.map(field => getCustomFieldComponent(field as PatientFieldDefinition));

  if (loading) return [];

  return padFields.map((field: string | object, i: number) => {
    if (isString(field)) {
      const Component = getComponentForField(field, customFieldIds);
      const isRequired = getLocalisation(`fields.${field}.requiredPatientData`);
      return <Component fieldName={field} key={field} required={isRequired} />;
    }

    // TODO: This is a hack to get working with location hierarchy
    if (isObject(field)) {
      const nextField = padFields[i + 1];
      return !isObject(nextField) ? (
        <HierarchyFields fields={CAMBODIA_LOCATION_HIERARCHY_FIELDS} />
      ) : null;
    }
  });
};
