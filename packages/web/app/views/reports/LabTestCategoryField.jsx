import React from 'react';

import { SuggesterSelectField, Field } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const LabTestCategoryField = ({
  name = 'labTestCategoryId',
  label,
  required,
  includeAllOption,
}) => (
  <Field
    name={name}
    includeAllOption={includeAllOption}
    label={label ?? <TranslatedText
      stringId="lab.testCategory.label"
      fallback="Test category"
      data-testid='translatedtext-s7gi' />}
    component={SuggesterSelectField}
    endpoint="labTestCategory"
    required={required}
    data-testid='field-ahpl' />
);
