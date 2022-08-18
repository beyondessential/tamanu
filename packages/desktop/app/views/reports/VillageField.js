import React from 'react';
import { connectApi } from '../../api';
import { AutocompleteField, LocalisedField } from '../../components';
import { Suggester } from '../../utils/suggester';

const DumbVillageField = ({ name = 'village', villageSuggester, required }) => (
  <LocalisedField
    name={name}
    path="fields.villageId"
    component={AutocompleteField}
    suggester={villageSuggester}
    required={required}
  />
);

export const VillageField = connectApi(api => ({
  villageSuggester: new Suggester(api, 'village'),
}))(DumbVillageField);
