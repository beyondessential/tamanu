import React, { type ReactElement, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView } from '/styled/common';
import { TextField } from '../../TextField/TextField';
import { Dropdown } from '~/ui/components/Dropdown';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { Field } from '~/ui/components/Forms/FormField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { PatientFieldDefinitionComponents } from '~/ui/helpers/fieldComponents';
import { useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { patientFieldDefinitionKeys } from '~/ui/hooks/queries/queryKeys';
import { useBackend } from '~/ui/hooks';
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
import { labels } from '~/ui/navigation/screens/home/PatientDetails/labels';
import type { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { useSettings } from '~/ui/contexts/SettingsContext';

const PlainField = ({ fieldName, required }): ReactElement => (
  // Outer styled view to momentarily add distance between fields
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
  const suggester = useMemo(() => getSuggester(models, type), [models, type]);

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
  const { data: fieldDefinition, isPending: loading } = useQuery({
    queryKey: patientFieldDefinitionKeys.detail(fieldName),
    queryFn: () =>
      Database.models.PatientFieldDefinition.findOne({
        where: { id: fieldName },
      }),
  });

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
  if (plainFields.has(fieldName)) {
    return PlainField;
  }
  if (selectFields.has(fieldName)) {
    return SelectField;
  }
  if (relationIdFields.has(fieldName)) {
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
  isEdit?: boolean;
}

export const PatientAdditionalDataFields = ({
  fields,
  isCustomSection,
  showMandatory = true,
  isEdit = true,
}: PatientAdditionalDataFieldsProps): ReactElement[] => {
  const { getSetting } = useSettings();
  const { data: customFieldIds, isPending: loading } = useQuery({
    queryKey: patientFieldDefinitionKeys.ids(),
    queryFn: () =>
      Database.models.PatientFieldDefinition.getRepository().find({
        select: ['id'],
      }),
    select: definitions => definitions.map(d => d.id),
  });

  if (isCustomSection) {
    return fields.map(field => getCustomFieldComponent(field as PatientFieldDefinition));
  }

  if (loading) return [];

  const padFields = getConfiguredPatientAdditionalDataFields(
    fields as string[],
    showMandatory,
    getSetting,
  );

  return padFields.map((field: string) => {
    const Component = getComponentForField(field, customFieldIds);
    const isRequired = getSetting<boolean>(`fields.${field}.requiredPatientData`);
    return <Component fieldName={field} key={field} required={isRequired} isEdit={isEdit} />;
  });
};
