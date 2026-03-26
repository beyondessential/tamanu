import React, { ReactElement, useMemo } from 'react';
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
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { useTranslation } from '~/ui/contexts/TranslationContext';
import { getReferenceDataStringId } from '~/ui/components/Translations/TranslatedReferenceData';

const REGISTRY_COUNT_THRESHOLD = 10;

export const ProgramRegistrySection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();
  const { ability } = useAuth();
  const { getTranslation } = useTranslation();

  const ProgramRegistrySuggester = useMemo(
    () =>
      new Suggester({
        model: models.ProgramRegistry,
        options: {
          where: {
            visibilityStatus: VisibilityStatus.Current,
          },
        },
        filter: ({ entity_id }) => ability.can('read', subject('ProgramRegistry', { id: entity_id })),
      }),
    [models.ProgramRegistry, ability],
  );

  const [programRegistries, programRegistryError, isProgramRegistryLoading] = useBackendEffect(
    async ({ models }) => {
      const rawData = await models.ProgramRegistry.getAllProgramRegistries();
      return rawData.map(({ name, id }) => ({
        label: getTranslation(getReferenceDataStringId(id, 'programRegistry'), name),
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
              stringId="programRegistry.programRegistry.label"
              fallback="Program registry"
            />
          }
          path="fields.programRegistry"
          labelFontSize={screenPercentageToDP(2, Orientation.Height)}
          fieldFontSize={screenPercentageToDP(2, Orientation.Height)}
          component={AutocompleteModalField}
          placeholder={getTranslation('general.action.search', 'Search')}
          suggester={ProgramRegistrySuggester}
          navigation={navigation}
          name="programRegistryId"
        />
      ) : (
        <LocalisedField
          label={
            <TranslatedText
              stringId="programRegistry.programRegistry.label"
              fallback="Program registry"
            />
          }
          path="fields.programRegistry"
          labelFontSize={screenPercentageToDP(2, Orientation.Height)}
          component={Dropdown}
          options={programRegistries}
          selectPlaceholderText={getTranslation('general.action.select', 'Select')}
          navigation={navigation}
          name="programRegistryId"
        />
      )}
    </StyledView>
  );
};
