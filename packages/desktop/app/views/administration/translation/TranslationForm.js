import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { LANGUAGE_CODES, LANGUAGE_NAMES_IN_ENGLISH } from '@tamanu/constants';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box, IconButton } from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons';
import shortid from 'shortid';
import { Alert, AlertTitle } from '@material-ui/lab';
import { useApi } from '../../../api';
import { Form, OutlinedButton, TableFormFields, TextField } from '../../../components';
import { AccessorField } from '../../patients/components/AccessorField';
import { LoadingIndicator } from '../../../components/LoadingIndicator';

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

const StyledAccessorField = styled(AccessorField)`
  flex-grow: 1;
`;

const useTranslationQuery = () => {
  const api = useApi();
  return useQuery(['translation'], () => api.get(`admin/translation`));
};

const useTranslationMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation(payload => api.put('v1/admin/translation', payload), {
    onSuccess: (responseData, { formProps }) => {
      queryClient.invalidateQueries(['translation']);
      formProps.resetForm();
    },
  });
};

const ErrorMessage = ({ error }) => {
  return (
    <Box p={5}>
      <Alert severity="error">
        <AlertTitle>Error: Could not load translations:</AlertTitle>
        {error}
      </Alert>
    </Box>
  );
};

const IconButtonCell = ({ children, icon, onClick }) => (
  <Box display="flex" alignItems="center">
    {children}
    <StyledIconButton onClick={onClick}>{icon}</StyledIconButton>
  </Box>
);

const TranslationField = ({ placeholderId, stringId, code }) => {
  // This format is necissary to avoid formik nesting at dot delimiters
  const id = `['${stringId || placeholderId}']`;
  return <AccessorField id={id} name={code} component={TextField} />;
};

export const FormContents = ({ data, setFieldValue, isSubmitting }) => {
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
      title: (
        <IconButtonCell onClick={handleAddColumn} icon={<AddIcon />}>
          String Id
        </IconButtonCell>
      ),
      accessor: ({ stringId, placeholderId }) => {
        if (!placeholderId) return stringId;
        return (
          <IconButtonCell onClick={() => handleRemoveColumn(placeholderId)} icon={<DeleteIcon />}>
            <StyledAccessorField id={placeholderId} name="stringId" component={TextField} />
          </IconButtonCell>
        );
      },
    },
    ...Object.values(LANGUAGE_CODES).map(code => ({
      key: code,
      title: LANGUAGE_NAMES_IN_ENGLISH[code],
      accessor: row => <TranslationField code={code} {...row} />,
    })),
  ];

  return (
    <>
      <StyledTableFormFields columns={columns} data={[...data, ...additionalColumns]} />
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <OutlinedButton disabled={isSubmitting} type="submit">
          Save
        </OutlinedButton>
      </Box>
    </>
  );
};

export const TranslationForm = () => {
  const { data = [], error, isLoading } = useTranslationQuery();
  const { mutate: saveTranslations, isLoading: isSaving } = useTranslationMutation();

  const initialValues = useMemo(
    () =>
      data.reduce(
        (acc, { stringId, ...rest }) => ({
          ...acc,
          [stringId]: rest,
        }),
        {},
      ),
    [data],
  );

  const handleSubmit = async payload => {
    // Swap temporary id out for stringId
    const submitData = Object.fromEntries(
      Object.entries(payload).map(([key, { stringId, ...rest }]) => [stringId || key, rest]),
    );
    await saveTranslations(submitData);
  };

  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Form
      initialValues={initialValues}
      enableReinitialize
      onSubmit={handleSubmit}
      render={props => <FormContents {...props} data={data} />}
    />
  );
};
