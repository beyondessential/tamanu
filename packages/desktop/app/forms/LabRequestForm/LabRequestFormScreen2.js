import React from 'react';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../api';
import { Field } from '../../components';
import { TestSelectorField } from '../../views/labRequest/TestSelector';

export const screen2ValidationSchema = yup.object().shape({
  labTestIds: yup
    .array()
    .of(yup.string())
    .required(),
});

export const LabRequestFormScreen2 = props => {
  const api = useApi();
  const { data: testTypesData, isLoading } = useQuery(
    ['labTestTypes'],
    () => api.get('labTestType'),
    {
      refetchOnWindowFocus: false,
    },
  );

  if (isLoading) return null;

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <Field
        name="labTestIds"
        label="Lab tests"
        component={TestSelectorField}
        testTypes={testTypesData}
        {...props}
      />
    </div>
  );
};
