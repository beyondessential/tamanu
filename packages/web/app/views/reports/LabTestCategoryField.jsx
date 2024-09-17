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
    label={
      label ?? (
        <TranslatedText
          stringId="report.generate.parameter.labTestCategory.label"
          fallback="Test category"
        />
      )
    }
    component={SuggesterSelectField}
    endpoint="labTestCategory"
    required={required}
  />
);
