import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { TranslatedText } from '@tamanu/ui-components';
import { TabDisplay } from '../../components/TabDisplay';
import { Colors } from '../../constants/styles';
import { AdminViewContainer } from './components/AdminViewContainer';
import { ImporterView } from './components/ImporterView';
import { ProgramExporterView } from './components/ProgramExporterView';

const StyledTabDisplay = styled(TabDisplay)`
  border-block-end: 1px solid ${Colors.outline};
  padding-inline: 20px;
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
        icon: <LoginIcon />,
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
        icon: <LogoutIcon />,
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
