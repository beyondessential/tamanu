import React from 'react';

import { SuggesterSelectField, Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const LabTestCategoryField = ({
  name = 'labTestCategoryId',
  required,
  includeAllOption,
}) => (
  <Field
    name={name}
    includeAllOption={includeAllOption}
    label={
      <TranslatedText
        stringId="report.parameter.labTestCategory.label"
        fallback="Lab Test Category"
      />
    }
    component={SuggesterSelectField}
    endpoint="labTestCategory"
    required={required}
  />
);
