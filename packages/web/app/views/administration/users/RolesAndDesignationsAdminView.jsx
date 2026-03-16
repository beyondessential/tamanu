import React from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router';
import styled from 'styled-components';

import { PlusIcon } from '../../../assets/icons/PlusIcon';
import { Button, DataFetchingTable, TranslatedText } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { Colors } from '../../../constants';
import { AdminViewContainer, ContentContainer } from '../components/AdminViewContainer';

const StyledTabDisplay = styled(TabDisplay)`
  display: grid;
  grid-template-rows: auto 1fr;
  .MuiTab-root:first-of-type {
    margin-inline-start: 30px;
  }
`;

export const Header = styled.header`
  align-items: flex-end;
  background-color: ${Colors.white};
  border-block-start: 1px solid ${Colors.outline};
  border-inline: 1px solid ${Colors.outline};
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  display: grid;
  gap: 0.625rem;
  grid-template-columns: auto minmax(min-content, max-content);
  padding-block: 0.625rem;
  padding-inline: 1.25rem;
`;

export const AddButton = styled(Button)`
  align-self: flex-end;
`;

export const plusIcon = (
  <PlusIcon
    aria-hidden
    width={18}
    height={18}
    style={{ color: 'oklch(from currentColor l c h / 96%)', marginInlineEnd: '0.5em' }}
  />
);

export const StyledDataFetchingTable = styled(DataFetchingTable)`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;

  /* Fit to meatball menu button width; let browser distribute remaining columns */
  th:last-of-type,
  td:last-of-type {
    inline-size: 0;
  }
`;

export const Article = styled.article`
  border-block-start: 1px solid ${Colors.outline};
  overflow: auto;
  padding-block: 26px;
  padding-inline: 30px;
  ${ContentContainer}:has(&) {
    background-color: #f7f9fb;
  }
`;

const TAB = /** @type {const} */ ({
  ROLES: 'roles',
  DESIGNATIONS: 'designations',
});

export const RolesAndDesignationsAdminView = () => {
  const navigate = useNavigate();
  const isDesignationsRoute = Boolean(useMatch('/admin/users/designations'));
  const currentTab = isDesignationsRoute ? TAB.DESIGNATIONS : TAB.ROLES;

  const onTabSelect = tabKey => {
    navigate(tabKey === TAB.DESIGNATIONS ? '/admin/users/designations' : '/admin/users/roles');
  };

  /** @see ./routes/AdministrationRoutes.jsx re <Outlet /> */
  const tabs = /** @type {const} */ ([
    {
      key: TAB.ROLES,
      label: <TranslatedText stringId="admin.roles.tab" fallback="Roles" />,
      render: Outlet,
    },
    {
      key: TAB.DESIGNATIONS,
      label: <TranslatedText stringId="admin.designations.tab" fallback="Designations" />,
      render: Outlet,
    },
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
