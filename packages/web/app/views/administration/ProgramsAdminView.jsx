import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { TabDisplay } from '../../components/TabDisplay';
import { ImporterView } from './components/ImporterView';
import { AdminViewContainer } from './components/AdminViewContainer';
import { ProgramExporterView } from './components/ProgramExporterView';
import { Colors } from '../../constants';
import { TranslatedText } from '../../components/Translation';

const StyledTabDisplay = styled(TabDisplay)`
  margin-top: 20px;
  border-top: 1px solid ${Colors.outline};

  .MuiTabs-root {
    padding: 0px 20px;
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const TabContainer = styled.div`
  padding: 20px;
  overflow-y: auto;
`;

export const ProgramsAdminView = () => {
  const [currentTab, setCurrentTab] = useState('import');
  const [isLoading, setIsLoading] = useState(false);

  const tabs = useMemo(
    () => [
      {
        label: 'Import',
        key: 'import',
        icon: 'fa fa-file-import',
        render: () => (
          <TabContainer data-testid='tabcontainer-e6sv'>
            <ImporterView endpoint="program" setIsLoading={setIsLoading} />
          </TabContainer>
        ),
      },
      {
        label: 'Export',
        key: 'export',
        icon: 'fa fa-file-export',
        render: () => (
          <TabContainer data-testid='tabcontainer-ru1l'>
            <ProgramExporterView setIsLoading={setIsLoading} />
          </TabContainer>
        ),
      },
    ],
    [],
  );

  return (
    <AdminViewContainer
      title={<TranslatedText
        stringId="admin.program.title"
        fallback="Programs (aka forms)"
        data-testid='translatedtext-0i4p' />}
      showLoadingIndicator={isLoading}
    >
      <StyledTabDisplay
        tabs={tabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        scrollable={false}
        data-testid='styledtabdisplay-lza8' />
    </AdminViewContainer>
  );
};
