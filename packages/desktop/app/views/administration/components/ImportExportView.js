import React, { memo, useState, useMemo } from 'react';
import styled from 'styled-components';
import { TopBar } from '../../../components';
import { TabDisplay } from '../../../components/TabDisplay';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { ImporterView } from './ImporterView';
import { ExporterView } from './ExporterView';
import { Colors } from '../../../constants';

const PageContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  > div:first-child {
    flex: 0;
  }

  > div:last-child {
    flex: 1;
  }

  form {
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    height: 100%;
  }
`;

const StyledTabDisplay = styled(TabDisplay)`
  > div:last-child {
    position: relative;
    flex: 1;
  }

  .MuiTabs-root {
    padding: 0 20px;
    border-bottom: 1px solid ${Colors.softOutline};
  }
`;

const LoadingContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 9999;
  overflow: hidden;
`;

const TabContainer = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
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
      <PageContainer>
        <TopBar title={title} />
        {isLoading && (
          <LoadingContainer>
            <LoadingIndicator />
          </LoadingContainer>
        )}
        <StyledTabDisplay
          tabs={tabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          scrollable={false}
        />
      </PageContainer>
    );
  },
);
