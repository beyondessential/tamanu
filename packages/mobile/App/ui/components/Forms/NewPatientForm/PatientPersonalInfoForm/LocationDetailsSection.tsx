import React, { ReactElement } from 'react';
import { useNavigation } from '@react-navigation/core';
import { FormGroup } from '../FormGroup';
import { Field } from '../../FormField';
import { AutocompleteModalField } from '~/ui/components/AutocompleteModal/AutocompleteModalField';
import { Routes } from '~/ui/helpers/routes';
import { ReferenceDataType } from '~/types';
import { Suggester } from '~/ui/helpers/suggester';
import { useBackend } from '~/ui/hooks';

export const LocationDetailsSection = (): ReactElement => {
  const navigation = useNavigation();
  const { models } = useBackend();

  const villageSuggester = new Suggester(
    models.ReferenceData,
    {
      where: {
        type: ReferenceDataType.Village,
      },
    },
  );

  return (
    <FormGroup sectionName="LOCATION DETAILS" marginTop>
      <Field
        label="Village"
        component={AutocompleteModalField}
        placeholder="Search villages"
        navigation={navigation}
        suggester={villageSuggester}
        modalRoute={Routes.Autocomplete.Modal}
        name="villageId"
      />
    </FormGroup>
  );
};
