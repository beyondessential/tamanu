import { useQuery } from '@tanstack/react-query';
import { LANGUAGE_CODES, LANGUAGE_NAMES_IN_ENGLISH } from '@tamanu/constants';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { keyBy } from 'lodash';
import { useApi } from '../../../api';
import { Form, TableFormFields } from '../../../components';

const StyledTableFormFields = styled(TableFormFields)`
  thead tr th {
    text-align: left;
  }
`;

const columns = [
  {
    key: 'stringId',
    title: 'String ID',
    accessor: ({ stringId }) => stringId,
  },
  ...Object.values(LANGUAGE_CODES).map(code => ({
    key: code,
    title: LANGUAGE_NAMES_IN_ENGLISH[code],
    accessor: values => values[code],
  })),
];

const useTranslationQuery = () => {
  const api = useApi();
  return useQuery(['translation'], () => api.get(`admin/translation`));
};

const renderForm = ({ data = [] }) => {
  return <StyledTableFormFields columns={columns} data={data} />;
};

export const TranslationForm = () => {
  const { data, error, isLoading } = useTranslationQuery();
  const initialValues = useMemo(() => keyBy(data, 'stringId'), [data]);
  return (
    <Form
      initialValues={initialValues}
      enableReinitialize
      onSubmit={() => {
        console.log('submit');
      }}
      render={props => renderForm({ ...props, data })}
    />
  );
};
