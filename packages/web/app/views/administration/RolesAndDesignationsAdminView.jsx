import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';

import { Form, FormSubmitButton, TextButton, TextField } from '@tamanu/ui-components';
import { DataFetchingTable, TranslatedText } from '../../components';
import { TabDisplay } from '../../components/TabDisplay';
import { Field } from '../../components/Field';
import { Colors } from '../../constants';
import { AdminViewContainer, ContentContainer } from './components/AdminViewContainer';
import { ROLES_ENDPOINT } from './constants';

const Article = styled.article`
  border-block-start: 1px solid ${Colors.outline};
  padding-block: 26px;
  padding-inline: 30px;
  ${ContentContainer}:has(&) {
    background-color: #f7f9fb;
  }
`;

const StyledForm = styled(Form)`
  align-items: flex-end;
  background-color: ${Colors.white};
  border-block-start: 1px solid ${Colors.outline};
  border-inline: 1px solid ${Colors.outline};
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  display: flex;
  flex-direction: row;
  gap: 0.625rem;
  padding-block: 0.625rem;
  padding-inline: 1.25rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  font-size: 0.875rem;
  gap: inherit;
  margin-inline-start: auto;
  button {
    font-size: inherit;
  }
`;

const StyledDataFetchingTable = styled(DataFetchingTable)`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;
  tbody tr:hover {
    background-color: ${Colors.veryLightBlue};
  }
`;

const StyledTabDisplay = styled(TabDisplay)`
  /* flex: 1; */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .MuiTabs-root {
    flex-shrink: 0;
  }
`;

const TAB = /** @type {const} */ ({
  ROLES: 'roles',
  DESIGNATIONS: 'designations',
});

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

const RolesView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const nameFromUrl = searchParams.get('name') ?? '';
  const idFromUrl = searchParams.get('id') ?? '';

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
                <TextButton
                  data-testid="roles-clear-button"
                  onClick={onClear}
                  style={{ paddingInline: '1em' }}
                >
                  <TranslatedText stringId="general.action.clear" fallback="Clear" />
                </TextButton>
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
        fetchOptions={{ id: idFromUrl, name: nameFromUrl }}
        initialSort={{ orderBy: 'name', order: 'asc' }}
        noDataMessage={
          <TranslatedText stringId="admin.roles.noData.message" fallback="No roles found" />
        }
      />
    </Article>
  );
};

export const RolesAndDesignationsAdminView = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /** @type {(typeof TAB)[keyof typeof TAB]} */
  const currentTab = location.pathname.split('/').at(-1);

  const onTabSelect = tabKey => {
    navigate(tabKey === TAB.DESIGNATIONS ? '/admin/designations' : '/admin/roles');
  };

  const tabs = /** @type {const} */ ([
    {
      key: TAB.ROLES,
      label: <TranslatedText stringId="admin.roles.tab" fallback="Roles" />,
      render: () => <RolesView />,
    },
    /* NASS-1909 */
    // {
    //   key: TAB.DESIGNATIONS,
    //   label: <TranslatedText stringId="admin.designations.tab" fallback="Designations" />,
    //   render: () => <Article />,
    // },
  ]);

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
      <StyledTabDisplay
        currentTab={currentTab}
        onTabSelect={onTabSelect}
        scrollable={false}
        tabs={tabs}
      />
    </AdminViewContainer>
  );
};
