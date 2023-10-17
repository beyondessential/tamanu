import { useQuery } from '@tanstack/react-query';
import { LANGUAGE_CODES, LANGUAGE_NAMES_IN_ENGLISH } from '@tamanu/constants';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { keyBy, mapValues, omit } from 'lodash';
import { Box, IconButton } from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons';
import shortid from 'shortid';
import { useApi } from '../../../api';
import { Form, TableFormFields, TextField } from '../../../components';
import { AccessorField } from '../../patients/components/AccessorField';

const StyledTableFormFields = styled(TableFormFields)`
  thead tr th {
    text-align: left;
  }
`;

const StyledIconButton = styled(IconButton)`
  padding: 3px;
  margin-left: 5px;
  color: #2f4358;
`;

const useTranslationQuery = () => {
  const api = useApi();
  return useQuery(['translation'], () => api.get(`admin/translation`));
};

const StringIdHeadCell = ({ onClick }) => (
  <Box display="flex" alignItems="center">
    String ID
    <StyledIconButton onClick={onClick}>
      <AddIcon />
    </StyledIconButton>
  </Box>
);

const StringIdField = ({ placeholderId, stringId, onClick }) => {
  if (!placeholderId) return stringId;
  return (
    <Box display="flex" alignItems="center">
      <AccessorField id={placeholderId} name="stringId" component={TextField} />
      <StyledIconButton>
        <DeleteIcon onClick={onClick} />
      </StyledIconButton>
    </Box>
  );
};

export const FormContents = ({ data, setFieldValue }) => {
  const [additionalColumns, setAdditionalColumns] = useState([]);

  const handleAddColumn = () => {
    setAdditionalColumns([
      ...additionalColumns,
      {
        placeholderId: shortid(),
        stringId: '',
        ...Object.values(LANGUAGE_CODES).reduce((acc, code) => ({ ...acc, [code]: '' }), {}),
      },
    ]);
  };

  const handleRemoveColumn = placeholderId => {
    setAdditionalColumns(
      additionalColumns.filter(column => column.placeholderId !== placeholderId),
    );
    setFieldValue(placeholderId, undefined);
  };

  const columns = [
    {
      key: 'stringId',
      title: <StringIdHeadCell onClick={handleAddColumn} />,
      accessor: ({ stringId, placeholderId }) => (
        <StringIdField
          placeholderId={placeholderId}
          stringId={stringId}
          onClick={() => handleRemoveColumn(placeholderId)}
        />
      ),
    },
    ...Object.values(LANGUAGE_CODES).map(code => ({
      key: code,
      title: LANGUAGE_NAMES_IN_ENGLISH[code],
      accessor: ({ stringId, placeholderId }) => (
        // If you don't pass the id like this the values will be nested on dot delimiter
        <AccessorField id={`['${stringId || placeholderId}']`} name={code} component={TextField} />
      ),
    })),
  ];

  return <StyledTableFormFields columns={columns} data={[...data, ...additionalColumns]} />;
};

export const TranslationForm = () => {
  const { data = [], error, isLoading } = useTranslationQuery();

  const initialValues = useMemo(
    () => mapValues(keyBy(data, 'stringId'), val => omit(val, 'stringId')),
    [data],
  );

  return (
    <Form
      initialValues={initialValues}
      enableReinitialize
      onSubmit={() => {
        console.log('submit');
      }}
      render={props => <FormContents {...props} data={data} />}
    />
  );
};
