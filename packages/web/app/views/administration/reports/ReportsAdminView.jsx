import React, { useState } from 'react';
import styled from 'styled-components';
import { TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { TopBar } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
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
      label: (
        <TranslatedText
          stringId="general.action.edit"
          fallback="Edit"
          data-testid="translatedtext-548k"
        />
      ),
      key: REPORT_TABS.EDIT,
      icon: 'fa fa-edit',
      render: () => (
        <TabContainer data-testid="tabcontainer-1z1w">
          <SelectReportView data-testid="selectreportview-o0eh" />
        </TabContainer>
      ),
    },
    {
      label: (
        <TranslatedText
          stringId="general.action.create"
          fallback="Create"
          data-testid="translatedtext-356m"
        />
      ),
      key: REPORT_TABS.CREATE,
      icon: 'fa fa-plus',
      render: () => (
        <TabContainer data-testid="tabcontainer-5zc2">
          <CreateReportView data-testid="createreportview-4awe" />
        </TabContainer>
      ),
    },
    {
      label: (
        <TranslatedText
          stringId="general.action.export"
          fallback="Export"
          data-testid="translatedtext-epio"
        />
      ),
      key: REPORT_TABS.EXPORT,
      icon: 'fa fa-file-export',
      render: () => (
        <TabContainer data-testid="tabcontainer-e5rr">
          <ExportReportView data-testid="exportreportview-a9dx" />
        </TabContainer>
      ),
    },
    {
      label: (
        <TranslatedText
          stringId="general.action.import"
          fallback="Import"
          data-testid="translatedtext-5szv"
        />
      ),
      key: REPORT_TABS.IMPORT,
      icon: 'fa fa-file-import',
      render: () => (
        <TabContainer data-testid="tabcontainer-wzws">
          <ImportReportView data-testid="importreportview-synr" />
        </TabContainer>
      ),
    },
  ];

  return (
    <OuterContainer data-testid="outercontainer-yq72">
      <TopBar
        title={
          <TranslatedText
            stringId="admin.reports.title"
            fallback="Reports"
            data-testid="translatedtext-0k80"
          />
        }
        data-testid="topbar-a7us"
      />
      <StyledTabDisplay
        tabs={tabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        scrollable={false}
        data-testid="styledtabdisplay-umxv"
      />
    </OuterContainer>
  );
};
