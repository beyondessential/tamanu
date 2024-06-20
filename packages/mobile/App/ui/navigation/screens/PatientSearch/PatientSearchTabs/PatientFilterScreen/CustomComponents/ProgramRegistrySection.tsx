import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';
import { subject } from '@casl/ability';

//Components
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend, useBackendEffect } from '~/ui/hooks';
import { useAuth } from '~/ui/contexts/AuthContext';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Dropdown } from '~/ui/components/Dropdown';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

const REGISTRY_COUNT_THRESHOLD = 10;

export const ProgramRegistrySection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();
  const { ability } = useAuth();

  const ProgramRegistrySuggester = new Suggester(
    models.ProgramRegistry,
    {
      where: {
        visibilityStatus: VisibilityStatus.Current,
      },
    },
    undefined,
    ({ id }) => ability.can('read', subject('ProgramRegistry', { id })),
  );

  const [programRegistries, programRegistryError, isProgramRegistryLoading] = useBackendEffect(
    async ({ models }) => {
      const rawData = await models.ProgramRegistry.getAllProgramRegistries();
      return rawData.map(({ name, id }) => ({
        label: name,
        value: id,
      }));
    },
    [],
  );

  if (isProgramRegistryLoading || programRegistryError) return;

  const doesRegistryCountExceedThreshold = programRegistries.length > REGISTRY_COUNT_THRESHOLD;

  return (
    <StyledView marginLeft={20} marginRight={20}>
      {doesRegistryCountExceedThreshold ? (
        <LocalisedField
          label={
          <TranslatedText
            stringId="general.localisedField.programRegistry.label"
            fallback="Program registry"
          />
          }
          localisationPath="fields.programRegistry"
          labelFontSize={14}
          component={AutocompleteModalField}
          placeholder="Search"
          suggester={ProgramRegistrySuggester}
          navigation={navigation}
          name="programRegistryId"
        />
      ) : (
        <LocalisedField
          label={
          <TranslatedText
            stringId="general.localisedField.programRegistry.label"
            fallback="Program registry"
          />
          }
          localisationPath="fields.programRegistry"
          labelFontSize={14}
          component={Dropdown}
          options={programRegistries}
          selectPlaceholderText="Select"
          navigation={navigation}
          name="programRegistryId"
        />
      )}
    </StyledView>
  );
};
