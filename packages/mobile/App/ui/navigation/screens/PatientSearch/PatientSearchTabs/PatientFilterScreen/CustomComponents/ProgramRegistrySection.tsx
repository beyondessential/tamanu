import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';
import { subject } from '@casl/ability';

//Components
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { useAuth } from '~/ui/contexts/AuthContext';
import { VisibilityStatus } from '~/visibilityStatuses';

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

  return (
    <StyledView marginLeft={20} marginRight={20}>
      <LocalisedField
        localisationPath="fields.programRegistry"
        labelFontSize={14}
        component={AutocompleteModalField}
        placeholder={`Search`}
        navigation={navigation}
        suggester={ProgramRegistrySuggester}
        name="programRegistryId"
      />
    </StyledView>
  );
};
