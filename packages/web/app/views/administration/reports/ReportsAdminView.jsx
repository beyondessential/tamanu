import React, { useState } from 'react';
import styled from 'styled-components';
import { TopBar } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { Colors } from '../../../constants';
import { ExportReportView } from './ExportReportView';
import { ImportReportView } from './ImportReportView';
import { CreateReportView } from './CreateReportView';
import { SelectReportView } from './SelectReportView';
import { TranslatedText } from '../../../components/Translation';

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
      label: <TranslatedText
        stringId="general.action.edit"
        fallback="Edit"
        data-testid='translatedtext-4czz' />,
      key: REPORT_TABS.EDIT,
      icon: 'fa fa-edit',
      render: () => (
        <TabContainer data-testid='tabcontainer-m0r1'>
          <SelectReportView />
        </TabContainer>
      ),
    },
    {
      label: <TranslatedText
        stringId="general.action.create"
        fallback="Create"
        data-testid='translatedtext-v0ij' />,
      key: REPORT_TABS.CREATE,
      icon: 'fa fa-plus',
      render: () => (
        <TabContainer data-testid='tabcontainer-qaqz'>
          <CreateReportView />
        </TabContainer>
      ),
    },
    {
      label: <TranslatedText
        stringId="general.action.export"
        fallback="Export"
        data-testid='translatedtext-ctm5' />,
      key: REPORT_TABS.EXPORT,
      icon: 'fa fa-file-export',
      render: () => (
        <TabContainer data-testid='tabcontainer-froq'>
          <ExportReportView />
        </TabContainer>
      ),
    },
    {
      label: <TranslatedText
        stringId="general.action.import"
        fallback="Import"
        data-testid='translatedtext-5xgl' />,
      key: REPORT_TABS.IMPORT,
      icon: 'fa fa-file-import',
      render: () => (
        <TabContainer data-testid='tabcontainer-i8mu'>
          <ImportReportView />
        </TabContainer>
      ),
    },
  ];

  return (
    <OuterContainer>
      <TopBar
        title={<TranslatedText
          stringId="admin.reports.title"
          fallback="Reports"
          data-testid='translatedtext-vd0q' />}
        data-testid='topbar-v633' />
      <StyledTabDisplay
        tabs={tabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        scrollable={false}
        data-testid='styledtabdisplay-8ycv' />
    </OuterContainer>
  );
};
