import { Field, useField } from 'formik';
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../api/useApi';
import { isErrorUnknownAllow404s } from '../../api';

const useLinkedFieldQuery = (endpoint, name, value) => {
  const api = useApi();
  return useQuery(
    ['linkedField', name, value],
    () =>
      api.get(`${endpoint.replace(':id', value)}`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
    {
      enabled: !!value,
    },
  );
};

export const LinkedField = ({ linkedFieldName, endpoint, ...props }) => {
  const [{ value }] = useField(props.name);
  const { setValue: setLinkedFieldValue } = useField(linkedFieldName)[2];
  const { data } = useLinkedFieldQuery(endpoint, props.name, value);

  useEffect(() => {
    if (!data?.id) return;
    setLinkedFieldValue(data.id);
  }, [data?.id, setLinkedFieldValue]);

  return <Field {...props} />;
};
