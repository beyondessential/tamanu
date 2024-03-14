import { Field, useField } from 'formik';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../api/useApi';

const useLinkedFieldQuery = (endpoint, name, value) => {
  const api = useApi();
  console.log('useLinkedFieldQuery', name, value, endpoint);
  return useQuery(['linkedField', name, value], () => api.get(`${endpoint}/${value}`), {
    enabled: !!value,
  });
};

export const LinkedField = ({ linkedFieldName, endpoint, ...props }) => {
  const [field] = useField(props.name);
  const { data, isLoading } = useLinkedFieldQuery(endpoint, props.name, field.value);

  return <Field {...props} />;
};
