import React, { useState } from 'react';
import styled from 'styled-components';
import { TopBar } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { Colors } from '../../../constants';

const OuterContainer = styled.div`
  position: relative;
  background-color: ${Colors.white};
  min-height: 100%;
`;

const StyledTabDisplay = styled(TabDisplay)`
  .MuiTabs-root {
    padding: 0px 20px;
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const TabContainer = styled.div`
  padding: 20px;
`;

const REPORT_TABS = {
  EDIT: 'edit',
  IMPORT: 'import',
  EXPORT: 'export',
};

export const ReportsAdminView = () => {
  const [currentTab, setCurrentTab] = useState(REPORT_TABS.EDIT);

  const tabs = [
    {
      label: 'Edit',
      key: REPORT_TABS.EDIT,
      icon: 'fa fa-file-export',
      render: () => <TabContainer>Coming soon</TabContainer>,
    },
  ];

  return (
    <OuterContainer>
      <TopBar title="Reports" />
      <StyledTabDisplay
        tabs={tabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        scrollable={false}
      />
    </OuterContainer>
  );
};
