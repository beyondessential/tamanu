import React, { ReactElement } from 'react';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { Button } from '../../Button';
import { TextField } from '../../TextField/TextField';
import { Dropdown } from '~/ui/components/Dropdown';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { Routes } from '~/ui/helpers/routes';
import { useBackend } from '~/ui/hooks';

import {
  plainFields,
  selectFields,
  selectFieldsOptions,
  relationIdFields,
  relationIdFieldsProperties,
  getSuggester,
} from './helpers';

const getPlainField = (fieldName: string): ReactElement => (
  // Outter styled view to momentarily add distance between fields
  <StyledView key={fieldName} paddingTop={15}>
    <LocalisedField name={fieldName} component={TextField} />
  </StyledView>
);

const getSelectField = (fieldName: string): ReactElement => (
  <LocalisedField
    key={fieldName}
    name={fieldName}
    options={selectFieldsOptions[fieldName]}
    component={Dropdown}
  />
);

const getRelationField = (fieldName: string, models, getString, navigation): ReactElement => {
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
      modalRoute={Routes.Autocomplete.Modal}
      name={fieldName}
    />
  );
};

export const PatientAdditionalDataFields = ({
  handleSubmit,
  isSubmitting,
  navigation,
  fields,
}): ReactElement => {
  const { models } = useBackend();
  const { getString } = useLocalisation();

  return (
    <StyledView justifyContent="space-between">
      {fields.map(fieldName => {
        if (plainFields.includes(fieldName)) {
          return getPlainField(fieldName);
        }
        if (selectFields.includes(fieldName)) {
          return getSelectField(fieldName);
        }
        if (relationIdFields.includes(fieldName)) {
          return getRelationField(fieldName, models, getString, navigation);
        }
        // Shouldn't happen, but info is only valuable to us
        console.error(`Unexpected field ${fieldName} for patient additional data.`);
        return null;
      })}
      <Button
        backgroundColor={theme.colors.PRIMARY_MAIN}
        onPress={handleSubmit}
        loadingAction={isSubmitting}
        buttonText="Save"
        marginTop={10}
      />
    </StyledView>
  );
};
