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
      api.get(
        endpoint.includes(':id') ? endpoint.replace(':id', value) : `${endpoint}/${value}`,
        {},
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
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
    if (!data?.id || !props.form.dirty) return;
    setLinkedFieldValue(data.id);
    // Important to only run this effect when the linkField query changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  return <Field {...props} data-testid='field-kaj8' />;
};
