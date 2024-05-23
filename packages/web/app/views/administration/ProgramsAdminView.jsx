import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { TabDisplay } from '../../components/TabDisplay';
import { ImporterView } from './components/ImporterView';
import { AdminViewContainer } from './components/AdminViewContainer';
import { ProgramExporterView } from './components/ProgramExporterView';

const StyledTabDisplay = styled(TabDisplay)`
  margin-top: 20px;
  border-top: 1px solid #dededede;

  .MuiTabs-root {
    padding: 0px 20px;
    border-bottom: 1px solid #dededede;
  }
`;

const TabContainer = styled.div`
  padding: 20px;
`;

export const ProgramsAdminView = () => {
  const title = 'Programs (aka forms)';
  const endpoint = 'program';
  const [currentTab, setCurrentTab] = useState('import');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = useMemo(
    () => [
      {
        label: 'Import',
        key: 'import',
        icon: 'fa fa-file-import',
        render: () => (
          <TabContainer>
            <ImporterView endpoint={endpoint} setIsLoading={setIsLoading} />
          </TabContainer>
        ),
      },
      {
        label: 'Export',
        key: 'export',
        icon: 'fa fa-file-export',
        render: () => (
          <TabContainer>
            <ProgramExporterView
              title={title}
              setIsLoading={setIsLoading}
            />
          </TabContainer>
        ),
      },
    ],
    [title, endpoint],
  );

  return (
    <AdminViewContainer title={title} showLoadingIndicator={isLoading}>
      <StyledTabDisplay
        tabs={tabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        scrollable={false}
      />
    </AdminViewContainer>
  );
};
