import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';

//Components
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend, useBackendEffect } from '~/ui/hooks';
import { VisibilityStatus } from '~/visibilityStatuses';
import { Dropdown } from '~/ui/components/Dropdown';

const REGISTRY_COUNT_THRESHOLD = 10;

export const ProgramRegistrySection = (): ReactElement => {
  const navigation = useNavigation();
  const models = useBackend();

  const ProgramRegistrySuggester = new Suggester(models.ProgramRegistry, {
    where: {
      visibilityStatus: VisibilityStatus.Current,
    },
  });

  const [programRegistries, programRegistryError, isProgramRegistryLoading] = useBackendEffect(
    async ({ models }) => {
      const rawData = models.ProgramRegistry.getAllProgramRegistries();
      return (await rawData).map(programRegistry => ({
        label: programRegistry.name,
        value: programRegistry.id,
      }));
    },
    [],
  );

  if (isProgramRegistryLoading || programRegistryError) return;

  const isRegistryCountExceedsThreshold = programRegistries.length > REGISTRY_COUNT_THRESHOLD;

  return (
    <StyledView marginLeft={20} marginRight={20}>
      <LocalisedField
        localisationPath="fields.programRegistry"
        labelFontSize={14}
        component={isRegistryCountExceedsThreshold ? AutocompleteModalField : Dropdown}
        options={isRegistryCountExceedsThreshold ? null : programRegistries}
        placeholder={isRegistryCountExceedsThreshold ? `Search` : null}
        suggester={isRegistryCountExceedsThreshold ? ProgramRegistrySuggester : null}
        navigation={navigation}
        name="programRegistryId"
      />
    </StyledView>
  );
};
