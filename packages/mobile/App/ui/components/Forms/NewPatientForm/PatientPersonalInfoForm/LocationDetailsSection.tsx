import React, { ReactElement, useMemo } from 'react';
import { useNavigation } from '@react-navigation/core';

import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';
import { TranslatedText } from '~/ui/components/Translations/TranslatedText';
import { useSettings } from '~/ui/contexts/SettingsContext';
import { useTranslation } from '~/ui/contexts/TranslationContext';

export const LocationDetailsSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();

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

  return (
    <LocalisedField
      component={AutocompleteModalField}
      label={
        <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
      }
      placeholder={`Search for ${getTranslation(
        'general.localisedField.villageId.label',
        'Village',
      )}`}
      navigation={navigation}
      suggester={villageSuggester}
      name="villageId"
      required={getSetting<boolean>('fields.villageId.requiredPatientData')}
    />
  );
};
