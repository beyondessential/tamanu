import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';

//Components
import { Section } from './Section';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { Routes } from '~/ui/helpers/routes';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

export const VillageSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();
  const { getString } = useLocalisation();

  const villageSuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.Village,
    },
  });

  // uses new IdRelation decorator on model, so the field is `villageId` and not `village`
  return (
    <Section localisationPath="fields.villageId">
      <StyledView
        height={screenPercentageToDP(15.01, Orientation.Height)}
        justifyContent="space-between"
      >
        <LocalisedField
          component={AutocompleteModalField}
          placeholder={`Search for ${getString('fields.villageId.longLabel', 'Village')}`}
          navigation={navigation}
          suggester={villageSuggester}
          modalRoute={Routes.Autocomplete.Modal}
          name="villageId"
        />
      </StyledView>
    </Section>
  );
};
