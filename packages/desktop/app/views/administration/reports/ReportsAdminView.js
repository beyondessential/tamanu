import React, { useState } from 'react';
import styled from 'styled-components';
import { TopBar } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { Colors } from '../../../constants';
import { ExportReportView } from './ExportReportView';
import { ImportReportView } from './ImportReportView';
import { CreateReportView } from './CreateReportView';
import { SelectReportView } from './SelectReportView';

const OuterContainer = styled.div`
  position: relative;
  background-color: ${Colors.background};
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
  CREATE: 'create',
  IMPORT: 'import',
  EXPORT: 'export',
};

export const ReportsAdminView = () => {
  const [currentTab, setCurrentTab] = useState(REPORT_TABS.EDIT);

  const tabs = [
    {
      label: 'Edit',
      key: REPORT_TABS.EDIT,
      icon: 'fa fa-edit',
      render: () => (
        <TabContainer>
          <SelectReportView />
        </TabContainer>
      ),
    },
    {
      label: 'Create',
      key: REPORT_TABS.CREATE,
      icon: 'fa fa-plus',
      render: () => (
        <TabContainer>
          <CreateReportView />
        </TabContainer>
      ),
    },
    {
      label: 'Export',
      key: REPORT_TABS.EXPORT,
      icon: 'fa fa-file-export',
      render: () => (
        <TabContainer>
          <ExportReportView />
        </TabContainer>
      ),
    },
    {
      label: 'Import',
      key: REPORT_TABS.IMPORT,
      icon: 'fa fa-file-import',
      render: () => (
        <TabContainer>
          <ImportReportView />
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
