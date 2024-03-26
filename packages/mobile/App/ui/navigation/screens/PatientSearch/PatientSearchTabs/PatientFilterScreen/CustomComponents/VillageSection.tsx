import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';

//Components
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

export const VillageSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();

  const villageSuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.Village,
    },
  });

  // uses new IdRelation decorator on model, so the field is `villageId` and not `village`
  return (
    <StyledView marginLeft={20} marginRight={20}>
      <LocalisedField
        localisationPath="fields.villageId"
        labelFontSize={14}
        component={AutocompleteModalField}
        placeholder={`Search`}
        navigation={navigation}
        suggester={villageSuggester}
        name="villageId"
      />
    </StyledView>
  );
};
