import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { TranslatedText } from '@tamanu/ui-components';
import { Colors } from '../../constants/styles';
import { TabDisplay } from '../../components/TabDisplay';
import { ImporterView } from './components/ImporterView';
import { AdminViewContainer } from './components/AdminViewContainer';
import { ProgramExporterView } from './components/ProgramExporterView';

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
          <TabContainer data-testid="tabcontainer-g2le">
            <ImporterView
              endpoint="program"
              setIsLoading={setIsLoading}
              data-testid="importerview-0cyu"
            />
          </TabContainer>
        ),
      },
      {
        label: 'Export',
        key: 'export',
        icon: 'fa fa-file-export',
        render: () => (
          <TabContainer data-testid="tabcontainer-za63">
            <ProgramExporterView
              setIsLoading={setIsLoading}
              data-testid="programexporterview-mazu"
            />
          </TabContainer>
        ),
      },
    ],
    [],
  );

  return (
    <AdminViewContainer
      title={
        <TranslatedText
          stringId="admin.program.title"
          fallback="Programs (aka forms)"
          data-testid="translatedtext-52ok"
        />
      }
      showLoadingIndicator={isLoading}
      data-testid="adminviewcontainer-w2w4"
    >
      <StyledTabDisplay
        tabs={tabs}
        currentTab={currentTab}
        onTabSelect={setCurrentTab}
        scrollable={false}
        data-testid="styledtabdisplay-gnxw"
      />
    </AdminViewContainer>
  );
};
