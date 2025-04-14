import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyledView } from '/styled/common';
import { TextField } from '../../TextField/TextField';
import { Dropdown } from '~/ui/components/Dropdown';
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
import { labels } from '~/ui/navigation/screens/home/PatientDetails/layouts/generic/labels';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { HierarchyFields } from '../../HierarchyFields';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { theme } from '~/ui/styled/theme';
import { TranslatedText } from '../../Translations/TranslatedText';
import { StyledText } from '~/ui/styled/common';
import { ADDITIONAL_DATA_LOCATION_HIERARCHY_FIELDS } from '~/ui/navigation/screens/home/PatientDetails/layouts/generic/fields';
import { PATIENT_DATA_FIELDS } from '~/ui/helpers/patient';

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
      options={options?.split(',')?.map((option) => ({ label: option, value: option }))}
      required={required}
    />
  );
};

const AddressHierarchyField = ({ isEdit }): ReactElement => {
  if (isEdit) {
    return <HierarchyFields fields={ADDITIONAL_DATA_LOCATION_HIERARCHY_FIELDS} />;
  }

  return (
    <StyledView>
      <StyledText
        color={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP(2.4, Orientation.Height)}
        fontWeight={500}
        marginBottom={screenPercentageToDP(1.2, Orientation.Height)}
      >
        <TranslatedText
          stringId={'patient.details.subheading.currentAddress'}
          fallback={'Current address'}
        />
      </StyledText>
      <HierarchyFields fields={ADDITIONAL_DATA_LOCATION_HIERARCHY_FIELDS} />
    </StyledView>
  );
};

function getComponentForField(
  fieldName: string,
  customFieldIds: string[],
  isUsingHierarchyLogic: boolean,
): React.FC<{ fieldName: string; required: boolean }> {
  if (plainFields.includes(fieldName)) {
    return PlainField;
  }
  if (selectFields.includes(fieldName)) {
    return SelectField;
  }
  if (isUsingHierarchyLogic && fieldName === PATIENT_DATA_FIELDS.VILLAGE_ID) {
    return AddressHierarchyField;
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
  isEdit?: boolean;
}

export const PatientAdditionalDataFields = ({
  fields,
  isCustomSection,
  showMandatory = true,
  isEdit = true,
}: PatientAdditionalDataFieldsProps): ReactElement[] => {
  const { getSetting } = useSettings();
  const [customFieldDefinitions, _, loading] = useBackendEffect(({ models }) =>
    models.PatientFieldDefinition.getRepository().find({
      select: ['id'],
    }),
  );
  const customFieldIds = customFieldDefinitions?.map(({ id }) => id);

  const padFields = getConfiguredPatientAdditionalDataFields(
    fields as string[],
    showMandatory,
    getSetting,
  );

  if (isCustomSection)
    return fields.map((field) => getCustomFieldComponent(field as PatientFieldDefinition));

  if (loading) return [];

  const isUsingHierarchyLogic = getSetting<boolean>('features.useLocationHierarchy');

  return padFields.map((field: string) => {
    const Component = getComponentForField(field, customFieldIds, isUsingHierarchyLogic);
    const isRequired = getSetting<boolean>(`fields.${field}.requiredPatientData`);
    return <Component fieldName={field} key={field} required={isRequired} isEdit={isEdit} />;
  });
};
