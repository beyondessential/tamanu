import React, { useState } from 'react';
import styled from 'styled-components';
import { TopBar } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { ReportsExportView } from './export';

const OuterContainer = styled.div`
  position: relative;
  background-color: white;
  min-height: 100%;
`;

const StyledTabDisplay = styled(TabDisplay)`
  .MuiTabs-root {
    padding: 0px 20px;
    border-bottom: 1px solid #dededede;
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
  const [currentTab, setCurrentTab] = useState(REPORT_TABS.EXPORT);

  const tabs = [
    {
      label: 'Export',
      key: REPORT_TABS.EXPORT,
      icon: 'fa fa-file-export',
      render: () => (
        <TabContainer>
          <ReportsExportView />
        </TabContainer>
      ),
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
