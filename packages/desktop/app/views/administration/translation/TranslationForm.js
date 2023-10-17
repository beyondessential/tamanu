import { useQuery } from '@tanstack/react-query';
import { LANGUAGE_CODES, LANGUAGE_NAMES_IN_ENGLISH } from '@tamanu/constants';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { keyBy, mapValues, omit } from 'lodash';
import { useApi } from '../../../api';
import { Form, TableFormFields, TextField } from '../../../components';
import { AccessorField } from '../../patients/components/AccessorField';
import { Box, IconButton } from '@material-ui/core';
import { AddCircle } from '@material-ui/icons';
import shortid from 'shortid';

const StyledTableFormFields = styled(TableFormFields)`
  thead tr th {
    text-align: left;
  }
`;

const StyledIconButton = styled(IconButton)`
  padding: 3px;
  margin-left: 10px;
  color: #2f4358;
`;

const useTranslationQuery = () => {
  const api = useApi();
  return useQuery(['translation'], () => api.get(`admin/translation`));
};

export const TranslationForm = () => {
  const { data = [], error, isLoading } = useTranslationQuery();
  const [additionalColumns, setAdditionalColumns] = useState([]);

  const initialValues = useMemo(
    () => mapValues(keyBy(data, 'stringId'), val => omit(val, 'stringId')),
    [data],
  );

  const columns = useMemo(
    () => [
      {
        key: 'stringId',
        title: (
          <Box display="flex" alignItems="center">
            String ID
            <StyledIconButton
              onClick={() => {
                setAdditionalColumns([
                  ...additionalColumns,
                  {
                    placeholderId: shortid(),
                    stringId: '',
                    ...Object.values(LANGUAGE_CODES).reduce(
                      (acc, code) => ({ ...acc, [code]: '' }),
                      {},
                    ),
                  },
                ]);
              }}
            >
              <AddCircle />
            </StyledIconButton>
          </Box>
        ),
        accessor: ({ stringId }) =>
          stringId || <AccessorField name="stringId" component={TextField} />,
      },
      ...Object.values(LANGUAGE_CODES).map(code => ({
        key: code,
        title: LANGUAGE_NAMES_IN_ENGLISH[code],
        // If you don't pass the id like this the values will be nested on dot delimiter
        accessor: row => (
          <AccessorField
            id={`['${row.stringId || row.placeholderId}']`}
            name={code}
            component={TextField}
          />
        ),
      })),
    ],
    [additionalColumns],
  );

  return (
    <Form
      initialValues={initialValues}
      enableReinitialize
      onSubmit={() => {
        console.log('submit');
      }}
      render={() => (
        <StyledTableFormFields columns={columns} data={[...data, ...additionalColumns]} />
      )}
    />
  );
};
