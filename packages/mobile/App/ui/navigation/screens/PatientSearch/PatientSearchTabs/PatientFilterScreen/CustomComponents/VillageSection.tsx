import React, { ReactElement, useMemo } from 'react';
import { useNavigation } from '@react-navigation/core';

//Components
import { StyledView } from '~/ui/styled/common';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
// Helpers
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';

export const VillageSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();

  const villageSuggester = useMemo(
    () =>
      new Suggester({
        model: models.ReferenceData,
        options: {
          where: {
            type: ReferenceDataType.Village,
          },
        },
      }),
    [models.ReferenceData],
  );

  // uses new IdRelation decorator on model, so the field is `villageId` and not `village`
  return (
    <StyledView marginLeft={20} marginRight={20}>
      <LocalisedField
        label={
          <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
        }
        labelFontSize={screenPercentageToDP(2, Orientation.Height)}
        fieldFontSize={screenPercentageToDP(2, Orientation.Height)}
        component={AutocompleteModalField}
        placeholder={`Search`}
        navigation={navigation}
        suggester={villageSuggester}
        name="villageId"
      />
    </StyledView>
  );
};
