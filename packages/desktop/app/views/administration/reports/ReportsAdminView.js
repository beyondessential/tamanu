import React, { useState } from 'react';
import styled from 'styled-components';
import { TopBar } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { Colors } from '../../../constants';
import { ReportsExportView } from './ReportsExportView';
import { ReportsEditorView } from './ReportsEditorView';
import { ReportsImportView } from './ReportsImportView';

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
  EDITOR: 'editor',
  IMPORT: 'import',
  EXPORT: 'export',
};

export const ReportsAdminView = () => {
  const [currentTab, setCurrentTab] = useState(REPORT_TABS.EDITOR);

  const tabs = [
    {
      label: 'Editor',
      key: REPORT_TABS.EDITOR,
      icon: 'fa fa-edit',
      render: () => (
        <TabContainer>
          <ReportsEditorView />
        </TabContainer>
      ),
    },
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
    {
      label: 'Import',
      key: REPORT_TABS.IMPORT,
      icon: 'fa fa-file-import',
      render: () => (
        <TabContainer>
          <ReportsImportView />
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
