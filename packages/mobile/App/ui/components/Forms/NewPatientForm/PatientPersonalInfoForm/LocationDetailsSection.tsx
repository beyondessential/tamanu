import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';

import { useSettings } from '~/ui/contexts/SettingContext';
import { LocalisedField } from '~/ui/components/Forms/LocalisedField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

export const LocationDetailsSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();
  const { getSetting } = useSettings();

  const villageSuggester = new Suggester(models.ReferenceData, {
    where: {
      type: ReferenceDataType.Village,
    },
  });

  return (
    <LocalisedField
      component={AutocompleteModalField}
      placeholder={`Search for ${getSetting<string>(
        'localisation.fields.villageId.longLabel',
        'Village',
      )}`}
      navigation={navigation}
      suggester={villageSuggester}
      name="villageId"
      required={getSetting<boolean>('localisation.fields.villageId.requiredPatientData')}
    />
  );
};
