import { useNavigation } from '@react-navigation/core';
import React, { ReactElement } from 'react';

// Components
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { StyledView } from '~/ui/styled/common';
import { Section } from './Section';
// Helpers
import { ReferenceDataType } from '~/types';
import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { Routes } from '~/ui/helpers/routes';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
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
          name="villageId"
        />
      </StyledView>
    </Section>
  );
};
