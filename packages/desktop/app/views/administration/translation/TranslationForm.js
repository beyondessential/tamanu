import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import * as yup from 'yup';
import { has } from 'lodash';
import { LANGUAGE_CODES, LANGUAGE_NAMES_IN_ENGLISH } from '@tamanu/constants';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box, IconButton } from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon } from '@material-ui/icons';
import shortid from 'shortid';
import { Alert, AlertTitle } from '@material-ui/lab';
import { toast } from 'react-toastify';
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

const validationSchema = yup.lazy(values => {
  const baseSchema = Object.values(LANGUAGE_CODES).reduce(
    (schema, code) => ({
      ...schema,
      [code]: yup.string().nullable(),
    }),
    {},
  );
  const newEntrySchema = {
    stringId: yup
      .string()
      .required('Required')
      .test(
        'isUnique',
        'Must be unique',
        value =>
          Object.entries(values).filter(([k, v]) => k === value || v.stringId === value).length ===
          1,
      ),
  };
  return yup.object().shape(
    Object.keys(values).reduce(
      (acc, key) => ({
        ...acc,
        [key]: yup.object({
          ...baseSchema,
          ...(has(values[key], 'stringId') && newEntrySchema),
        }),
      }),
      {},
    ),
  );
});

const useTranslationQuery = () => {
  const api = useApi();
  return useQuery(['translation'], () => api.get(`admin/translation`));
};

const useTranslationMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation(payload => api.put('admin/translation', payload), {
    onSuccess: response => {
      const newStringIds = response?.data?.length;
      toast.success(
        `Translations saved${
          newStringIds ? `, Created ${newStringIds} new translated string entries` : ''
        }`,
      );
      queryClient.invalidateQueries(['translation']);
    },
    onError: err => {
      toast.error(`Error saving translations: ${err.message}`);
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

const TranslationField = ({ placeholderId, stringId, code }) => (
  // This id format is necessary to avoid formik nesting at . delimiters
  <AccessorField id={`['${placeholderId || stringId}']`} name={code} component={TextField} />
);

export const FormContents = ({
  data,
  setFieldValue,
  isSaving,
  dirty,
  additionalColumns,
  setAdditionalColumns,
}) => {
  const handleAddColumn = () => {
    const placeholderId = shortid();
    setAdditionalColumns([
      ...additionalColumns,
      {
        placeholderId,
      },
    ]);
    // Initialize stringId so it can be validated if empty
    setFieldValue(`${placeholderId}.stringId`, '');
  };

  const handleRemoveColumn = placeholderId => {
    setAdditionalColumns(
      additionalColumns.filter(column => column.placeholderId !== placeholderId),
    );
    setFieldValue(`${placeholderId}.stringId`, undefined);
  };

  const columns = [
    {
      key: 'stringId',
      title: (
        <Box display="flex" alignItems="center">
          Translation ID
          <StyledIconButton onClick={handleAddColumn}>
            <AddIcon />
          </StyledIconButton>
        </Box>
      ),
      accessor: ({ stringId, placeholderId }) => {
        if (!placeholderId) return stringId;
        return (
          <AccessorField
            id={placeholderId}
            name="stringId"
            component={TextField}
            InputProps={{
              endAdornment: (
                <StyledIconButton onClick={() => handleRemoveColumn(placeholderId)}>
                  <DeleteIcon />
                </StyledIconButton>
              ),
            }}
          />
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
        <OutlinedButton disabled={isSaving || !dirty} type="submit">
          Save
        </OutlinedButton>
      </Box>
    </>
  );
};

export const TranslationForm = () => {
  const [additionalColumns, setAdditionalColumns] = useState([]);
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
    setAdditionalColumns([]);
  };

  if (isLoading) return <LoadingIndicator />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Form
      initialValues={initialValues}
      enableReinitialize
      showInlineErrorsOnly
      onSubmit={handleSubmit}
      validationSchema={validationSchema}
      render={props => (
        <FormContents
          {...props}
          data={data}
          isSaving={isSaving}
          setAdditionalColumns={setAdditionalColumns}
          additionalColumns={additionalColumns}
        />
      )}
    />
  );
};
