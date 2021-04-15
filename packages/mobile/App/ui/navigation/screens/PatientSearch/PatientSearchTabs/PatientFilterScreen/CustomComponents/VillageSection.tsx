import React, { ReactElement } from 'react';
//Components
import { Section } from './Section';
import { StyledView } from '/styled/common';
import { Field } from '/components/Forms/FormField';
import { TextField } from '/components/TextField/TextField';
// Helpers
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { useNavigation } from '@react-navigation/core';
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
    <Section title="Village">
      <StyledView
        height={screenPercentageToDP(15.01, Orientation.Height)}
        justifyContent="space-between"
      >
        <Field
          label="Village"
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
