import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';

import { TranslatedText } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer, ContentContainer } from '../components/AdminViewContainer';
import { RolesAdminView } from './RolesAdminView';
import { Colors } from '../../../constants';

const StyledTabDisplay = styled(TabDisplay)`
  .MuiTab-root:first-of-type {
    margin-inline-start: 30px;
  }
`;

export const Article = styled.article`
  border-block-start: 1px solid ${Colors.outline};
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
      render: () => <RolesAdminView />,
    },
    /* NASS-1909 */
    {
      key: TAB.DESIGNATIONS,
      label: <TranslatedText stringId="admin.designations.tab" fallback="Designations" />,
      render: () => <Article />,
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
