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
      data-test-id='translatedtext-6db5' />}
    component={SuggesterSelectField}
    endpoint="labTestCategory"
    required={required}
    data-test-id='field-0jnu' />
);
