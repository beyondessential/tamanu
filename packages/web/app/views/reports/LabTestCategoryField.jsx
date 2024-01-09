import React from 'react';

import { Field, SuggesterSelectField } from '../../components';

export const LabTestCategoryField = ({
  name = 'labTestCategoryId',
  required,
  includeAllOption,
}) => (
  <Field
    name={name}
    includeAllOption={includeAllOption}
    label="Test category"
    component={SuggesterSelectField}
    endpoint="labTestCategory"
    required={required}
  />
);
