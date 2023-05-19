import React from 'react';

import { SuggesterSelectField, Field } from '../../components';

export const LabTestCategoryField = ({ name = 'labTestCategoryId', required }) => (
  <Field
    name={name}
    label="Test category"
    component={SuggesterSelectField}
    endpoint="labTestCategory"
    required={required}
  />
);
