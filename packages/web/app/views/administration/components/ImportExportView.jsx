import React, { memo, useState, useMemo } from 'react';
import styled from 'styled-components';

import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer } from './AdminViewContainer';
import { ImporterView } from './ImporterView';
import { ExporterView } from './ExporterView';

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

export const ImportExportView = memo(
  ({ title, endpoint, dataTypes, dataTypesSelectable, disableExport }) => {
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
              <ImporterView
                endpoint={endpoint}
                dataTypes={dataTypes}
                dataTypesSelectable={dataTypesSelectable}
                setIsLoading={setIsLoading}
              />
            </TabContainer>
          ),
        },
        !disableExport && {
          label: 'Export',
          key: 'export',
          icon: 'fa fa-file-export',
          render: () => (
            <TabContainer>
              <ExporterView
                title={title}
                endpoint={endpoint}
                dataTypes={dataTypes}
                dataTypesSelectable={dataTypesSelectable}
                setIsLoading={setIsLoading}
              />
            </TabContainer>
          ),
        },
      ],
      [title, endpoint, dataTypes, dataTypesSelectable, disableExport],
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
  },
);
