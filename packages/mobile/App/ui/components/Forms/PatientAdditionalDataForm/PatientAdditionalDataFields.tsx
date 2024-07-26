import React, { ReactElement, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import styled from 'styled-components';
import { StyledText, StyledView } from '/styled/common';
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
import { labels } from '~/ui/navigation/screens/home/PatientDetails/layouts/generic/labels';
import { PatientFieldDefinition } from '~/models/PatientFieldDefinition';
import {
  CAMBODIA_CUSTOM_FIELDS,
  CAMBODIA_LOCATION_HIERARCHY_FIELDS,
  CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS,
  SECONDARY_LOCATION_HIERARCHY_FIELDS,
} from '/navigation/screens/home/PatientDetails/layouts/cambodia/fields';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { theme } from '/styled/theme';
import { TranslatedText } from '/components/Translations/TranslatedText';
import { Checkbox } from '../../Checkbox';

const HierarchyFieldContainer = styled(StyledView)`
  padding: 10px 8px 0 10px;
  border: 1px solid ${theme.colors.BOX_OUTLINE};
  border-radius: 3px;
  margin-bottom: 10px;
`;

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

const HierarchyField = ({
  fieldName,
  isEdit,
  isRequired,
  sameAddress,
  toggleSameAddress,
}): ReactElement => {
  const secondary = fieldName.toLowerCase().includes('secondary');
  const fields = {
    [CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS.VILLAGE_ID]: CAMBODIA_LOCATION_HIERARCHY_FIELDS,
    [CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS.SECONDARY_VILLAGE_ID]: SECONDARY_LOCATION_HIERARCHY_FIELDS,
  };
  const stringId = {
    [CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS.VILLAGE_ID]: 'patient.details.subheading.currentAddress',
    [CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS.SECONDARY_VILLAGE_ID]:
      'patient.details.subheading.permanentAddress',
  };

  const fallback = {
    [CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS.VILLAGE_ID]: 'Current address',
    [CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS.SECONDARY_VILLAGE_ID]: 'Permanent address',
  };

  const streetFieldName = secondary
    ? CAMBODIA_CUSTOM_FIELDS.SECONDARY_STREET_ADDRESS
    : 'streetVillage';

  if (isEdit) {
    return <HierarchyFields fields={fields[fieldName]} />;
  }

  if (sameAddress && secondary) return null;
  return (
    <StyledView>
      <StyledText
        color={theme.colors.TEXT_SUPER_DARK}
        fontSize={screenPercentageToDP(2.4, Orientation.Height)}
        fontWeight={500}
        marginBottom={screenPercentageToDP(1.2, Orientation.Height)}
      >
        <TranslatedText stringId={stringId[fieldName]} fallback={fallback[fieldName]} />
      </StyledText>
      <HierarchyFieldContainer>
        <HierarchyFields fields={fields[fieldName]} />
        <PlainField fieldName={streetFieldName} key={streetFieldName} required={isRequired} />
        {!secondary && (
          <Field
            component={Checkbox}
            name="sameAddress"
            text={
              <TranslatedText
                stringId="cambodiaPatientDetails.checkbox.sameAddress.label"
                fallback="Same as permanent address"
              />
            }
            value={sameAddress}
            onChange={toggleSameAddress}
          />
        )}
      </HierarchyFieldContainer>
    </StyledView>
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
  if (Object.values(CAMBODIA_LOCATION_HIERARCHY_FIELD_IDS).includes(fieldName)) {
    return HierarchyField;
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
  const { getLocalisation } = useLocalisation();
  const isHardCodedLayout = getLocalisation('layouts.patientDetails') !== 'generic';
  const [customFieldDefinitions, _, loading] = useBackendEffect(({ models }) =>
    models.PatientFieldDefinition.getRepository().find({
      select: ['id'],
    }),
  );

  const [sameAddress, setSameAddress] = useState(true);
  const toggleSameAddress = () => setSameAddress(!sameAddress);

  const customFieldIds = customFieldDefinitions?.map(({ id }) => id);

  const padFields = isHardCodedLayout
    ? fields
    : getConfiguredPatientAdditionalDataFields(fields as string[], showMandatory, getLocalisation);

  if (isCustomSection)
    return fields.map(field => getCustomFieldComponent(field as PatientFieldDefinition));

  if (loading) return [];

  return padFields.map((field: string) => {
    //exceptional fields that are handled separatively
    if (['streetVillage', CAMBODIA_CUSTOM_FIELDS.SECONDARY_STREET_ADDRESS].includes(field)) {
      return null;
    }
    const Component = getComponentForField(field, customFieldIds);
    const isRequired = getLocalisation(`fields.${field}.requiredPatientData`);
    return (
      <Component
        fieldName={field}
        key={field}
        required={isRequired}
        isEdit={isEdit}
        sameAddress={sameAddress}
        toggleSameAddress={toggleSameAddress}
      />
    );
  });
};
