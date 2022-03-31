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

export const PatientAdditionalDataFields = ({
  handleSubmit,
  isSubmitting,
  navigation,
}): ReactElement => {
  const { models } = useBackend();
  const { getString } = useLocalisation();

  return (
    <StyledView justifyContent="space-between">
      {plainFields.map((fieldName, i) => (
        // Outter styled view to momentarily add distance between fields
        <StyledView key={fieldName} marginTop={i === 0 ? 0 : 15}>
          <LocalisedField name={fieldName} component={TextField} />
        </StyledView>
      ))}
      {selectFields.map((fieldName, i) => (
        // Outter styled view to momentarily add distance between fields
        <StyledView key={fieldName} marginTop={i === 0 ? 7 : 0}>
          <LocalisedField
            name={fieldName}
            options={selectFieldsOptions[fieldName]}
            component={Dropdown}
          />
        </StyledView>
      ))}
      {relationIdFields.map(fieldName => {
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
