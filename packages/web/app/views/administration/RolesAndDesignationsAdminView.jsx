import React from 'react';
import { useSearchParams } from 'react-router';
import styled from 'styled-components';

import { Button, Form, FormSubmitButton, TextField } from '@tamanu/ui-components';
import { DataFetchingTable, TranslatedText } from '../../components';
import { Field } from '../../components/Field';
import { Colors } from '../../constants';
import { AdminViewContainer } from './components/AdminViewContainer';
import { ROLES_ENDPOINT } from './constants';

const Article = styled.article`
  padding: 24px 30px;
  background-color: ${Colors.background};
  border-top: 1px solid ${Colors.outline};
`;

const StyledForm = styled(Form)`
  align-items: flex-end;
  background-color: ${Colors.white};
  border-block-start: 1px solid ${Colors.outline};
  border-inline: 1px solid ${Colors.outline};
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  padding-block: 0.625rem;
  padding-inline: 1.25rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: inherit;
  margin-inline-start: auto;
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  box-shadow: unset;
  tbody tr:hover {
    background-color: ${Colors.veryLightBlue};
  }
`;

const COLUMNS = /** @type {const} */ ([
  {
    key: 'name',
    title: <TranslatedText stringId="admin.roles.name.column" fallback="Name" />,
    sortable: true,
  },
  {
    key: 'id',
    title: <TranslatedText stringId="admin.roles.id.column" fallback="ID" />,
    sortable: true,
  },
]);

export const RolesAndDesignationsAdminView = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const nameFromUrl = searchParams.get('name') ?? '';
  const idFromUrl = searchParams.get('id') ?? '';
  const fetchOptions = { id: idFromUrl, name: nameFromUrl };

  const onSubmit = values => {
    const name = values.name?.trim();
    const id = values.id?.trim();
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);

        if (id) next.set('id', id);
        else next.delete('id');

        if (name) next.set('name', name);
        else next.delete('name');

        return next;
      },
      { replace: true },
    );
  };

  const onClear = () => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        next.delete('name');
        return next;
      },
      { replace: true },
    );
  };

  return (
    <AdminViewContainer
      title={
        <TranslatedText
          stringId="adminSidebar.rolesAndDesignations"
          fallback="Roles & designations"
          data-testid="translatedtext-roles-designations-title"
        />
      }
    >
      <Article>
        <search>
          <StyledForm
            initialValues={{ id: idFromUrl, name: nameFromUrl }}
            key={`id=${idFromUrl}&name=${nameFromUrl}`}
            onSubmit={onSubmit}
            render={({ submitForm }) => (
              <>
                <Field
                  component={TextField}
                  inputProps={{ 'data-testid': 'roles-search-name-input' }}
                  label={<TranslatedText stringId="admin.roles.name.label" fallback="Name" />}
                  name="name"
                  placeholder="Search…"
                  size="small"
                  style={{ inlineSize: '25.625rem' }}
                />
                <Field
                  component={TextField}
                  inputProps={{ 'data-testid': 'roles-search-id-input' }}
                  label={<TranslatedText stringId="admin.roles.id.label" fallback="ID" />}
                  name="id"
                  placeholder="Search…"
                  size="small"
                  style={{ inlineSize: '25.625rem' }}
                />
                <ButtonGroup>
                  <FormSubmitButton
                    color="primary"
                    data-testid="roles-search-button"
                    onClick={submitForm}
                  >
                    <TranslatedText stringId="general.action.search" fallback="Search" />
                  </FormSubmitButton>
                  <Button data-testid="roles-clear-button" onClick={onClear} variant="outlined">
                    <TranslatedText stringId="general.action.clear" fallback="Clear" />
                  </Button>
                </ButtonGroup>
              </>
            )}
          />
        </search>
        <StyledDataFetchingTable
          allowExport={false}
          columns={COLUMNS}
          data-testid="roles-table"
          defaultRowsPerPage={10}
          endpoint={ROLES_ENDPOINT}
          fetchOptions={fetchOptions}
          initialSort={{ orderBy: 'name', order: 'asc' }}
          noDataMessage={
            <TranslatedText stringId="admin.roles.noData.message" fallback="No roles found" />
          }
        />
      </Article>
    </AdminViewContainer>
  );
};
