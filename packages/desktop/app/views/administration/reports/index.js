import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { TopBar } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { ReportsEditView } from './edit';
import { ReportsExportView } from './export';
import { ReportsImportView } from './import';

const OuterContainer = styled.div`
  position: relative;
  background-color: white;
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
  const [currentTab, setCurrentTab] = useState(REPORT_TABS.EDIT);

  const tabs = useMemo(() => [
    {
      label: 'Edit',
      key: REPORT_TABS.EDIT,
      icon: 'fa fa-edit',
      render: () => (
        <TabContainer>
          <ReportsEditView />
        </TabContainer>
      ),
    },
    {
      label: 'Import',
      key: REPORT_TABS.IMPORT,
      icon: 'fa fa-file-import',
      render: () => <TabContainer>
        <ReportsImportView />
      </TabContainer>,
    },
    {
      label: 'Export',
      key: REPORT_TABS.EXPORT,
      icon: 'fa fa-file-export',
      render: () => <TabContainer>
        <ReportsExportView />
      </TabContainer>,
    },
  ]);

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
