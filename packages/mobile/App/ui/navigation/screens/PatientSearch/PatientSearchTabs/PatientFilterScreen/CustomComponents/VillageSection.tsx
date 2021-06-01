import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';

//Components
import { Section } from './Section';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { screenPercentageToDP, Orientation } from '~/ui/helpers/screen';
import { Routes } from '~/ui/helpers/routes';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

export const VillageSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();

  const villageSuggester = new Suggester(
    models.ReferenceData, // ReferenceData clearly inherits from a class which has id, plus it implements an interface with id...
    {
      where: {
        type: ReferenceDataType.Village,
      },
    },
  );

  // uses new IdRelation decorator on model, so the field is `villageId` and not `village`
  return (
    <Section name="villageId" defaultTitle="Village">
      <StyledView
        height={screenPercentageToDP(15.01, Orientation.Height)}
        justifyContent="space-between"
      >
        <LocalisedField
          defaultLabel="Village"
          component={AutocompleteModalField}
          placeholder="Search villages"
          navigation={navigation}
          suggester={villageSuggester}
          modalRoute={Routes.Autocomplete.Modal}
          name="villageId"
        />
      </StyledView>
    </Section>
  );
};
