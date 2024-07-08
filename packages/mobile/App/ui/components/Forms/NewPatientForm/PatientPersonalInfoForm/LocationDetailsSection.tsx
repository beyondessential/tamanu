import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';

import { useLocalisation } from '~/ui/contexts/LocalisationContext';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';

export const LocationDetailsSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();
  const { getString, getBool } = useLocalisation();

  const villageSuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.Village,
    },
  });

  return (
    <LocalisedField
      component={AutocompleteModalField}
      label={
        <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
      }
      placeholder={`Search for ${getString('fields.villageId.longLabel', 'Village')}`}
      navigation={navigation}
      suggester={villageSuggester}
      name="villageId"
      required={getBool('fields.villageId.requiredPatientData')}
    />
  );
};
