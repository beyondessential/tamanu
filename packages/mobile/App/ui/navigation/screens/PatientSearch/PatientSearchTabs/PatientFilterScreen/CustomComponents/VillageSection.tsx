import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';

//Components
import { Section } from './Section';
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { useSettings } from '~/ui/contexts/SettingContext';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

export const VillageSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();
  const { getSetting } = useSettings();

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
          placeholder={`Search for ${getSetting(
            'localisation.fields.villageId.longLabel',
            'Village',
          )}`}
          navigation={navigation}
          suggester={villageSuggester}
          name="villageId"
        />
      </StyledView>
    </Section>
  );
};
