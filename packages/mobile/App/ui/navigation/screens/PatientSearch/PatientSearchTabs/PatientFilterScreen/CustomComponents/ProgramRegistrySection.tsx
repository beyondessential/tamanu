import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';

//Components
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { VisibilityStatus } from '~/visibilityStatuses';

export const ProgramRegistrySection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();

  const ProgramRegistrySuggester = new Suggester(models.ProgramRegistry, {
    where: {
      visibilityStatus: VisibilityStatus.Current,
    },
  });

  // uses new IdRelation decorator on model, so the field is `villageId` and not `village`
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
