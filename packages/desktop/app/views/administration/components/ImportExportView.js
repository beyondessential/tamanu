import React, { memo, useState, useMemo } from 'react';
import styled from 'styled-components';

import { TabDisplay } from '../../../components/TabDisplay';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { ImporterView } from './ImporterView';
import { ExporterView } from './ExporterView';

const OuterContainer = styled.div`
  position: relative;
`;

const ContentContainer = styled.div`
  padding: 20px;
  background-color: white;
  height: 100%;
`;

const LoadingContainer = styled.div`
  position: absolute;
  width: 100%;
  z-index: 9999;
`;

const Title = styled.h1`
  padding: 20px;
  margin: 0px;
`;

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

export const ImportExportView = memo(({ title, endpoint, dataTypes, dataTypesSelectable }) => {
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
      {
        label: 'Export',
        key: 'export',
        icon: 'fa fa-file-export',
        render: () => (
          <TabContainer>
            <ExporterView
              endpoint={endpoint}
              dataTypes={dataTypes}
              dataTypesSelectable={dataTypesSelectable}
              setIsLoading={setIsLoading}
            />
          </TabContainer>
        ),
      },
    ],
    [endpoint, dataTypes, dataTypesSelectable],
  );

  return (
    <OuterContainer>
      {isLoading && (
        <LoadingContainer>
          <LoadingIndicator />
        </LoadingContainer>
      )}
      <ContentContainer>
        <Title>{title}</Title>
        <StyledTabDisplay
          tabs={tabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          scrollable={false}
        />
      </ContentContainer>
    </OuterContainer>
  );
});
