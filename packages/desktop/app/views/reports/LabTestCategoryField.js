import React from 'react';
import { useQuery } from '@tanstack/react-query';

import { useApi } from '../../api';
import { SelectField, Field } from '../../components';

export const LabTestCategoryField = ({ name = 'labTestCategoryId', required }) => {
  const api = useApi();
  const { data: queryData } = useQuery(['labTestCategories'], () => api.get(`labTest/categories`));
  const testCategories = queryData?.data || [];
  const testCategoriesOptions = testCategories.map(({ id, name: categoryName }) => ({
    value: id,
    label: categoryName,
  }));

  return (
    <Field
      name={name}
      label="Test category"
      component={SelectField}
      options={testCategoriesOptions}
      required={required}
    />
  );
};
