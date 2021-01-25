import React from 'react';
import { connectApi } from '../../api';
import { AutocompleteField, Field } from '../../components';
import { Suggester } from '../../utils/suggester';

const DumbVillageField = ({ villageSuggester, required }) => {
  return (
    <Field
      name="village"
      label="Village"
      component={AutocompleteField}
      suggester={villageSuggester}
      required={required}
    />
  );
};

export const VillageField = connectApi(api => ({
  villageSuggester: new Suggester(api, 'village'),
}))(DumbVillageField);
