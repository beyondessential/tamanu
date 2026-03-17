import React from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router';
import styled from 'styled-components';

import { TranslatedText } from '../../../components';
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
