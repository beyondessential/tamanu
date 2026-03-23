import React from 'react';
import { Outlet, useMatch, useNavigate } from 'react-router';
import styled from 'styled-components';

import { TranslatedText } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer } from '../components/AdminViewContainer';

const StyledTabDisplay = styled(TabDisplay)`
  display: grid;
  grid-template-rows: auto 1fr;
  .MuiTab-root:first-of-type {
    margin-inline-start: 30px;
  }
`;

const TAB = /** @type {const} */ ({
  ROLES: 'roles',
  DESIGNATIONS: 'designations',
});

export const RolesAndDesignationsAdminView = () => {
  const navigate = useNavigate();
  const isDesignationsRoute = Boolean(
    useMatch({ path: '/admin/users/rolesAndDesignations/designations', end: false }),
  );
  const currentTab = isDesignationsRoute ? TAB.DESIGNATIONS : TAB.ROLES;

  const onTabSelect = tabKey => {
    navigate(
      `/admin/users/rolesAndDesignations/${tabKey === TAB.DESIGNATIONS ? 'designations' : 'roles'}`,
    );
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
