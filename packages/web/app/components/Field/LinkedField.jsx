import { Field, useField } from 'formik';
import React, { useEffect } from 'react';
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
  const linkedFieldRes = useField(linkedFieldName);
  const { data, isLoading } = useLinkedFieldQuery(endpoint, props.name, field.value);

  useEffect(() => {
    if (data && !isLoading) {
      console.log('Setting linked field', linkedFieldName, data);
      linkedFieldRes[2].setValue(data.id);
    }
  }, [data, isLoading, linkedFieldName, linkedFieldRes]);

  return <Field {...props} />;
};
