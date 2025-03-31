import React, { memo, useMemo, useState } from 'react';
import styled from 'styled-components';

import { TabDisplay } from '../../../components/TabDisplay';
import { AdminViewContainer } from './AdminViewContainer';
import { ImporterView } from './ImporterView';
import { ExporterView } from './ExporterView';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

const StyledTabDisplay = styled(TabDisplay)`
  margin-top: 20px;
  display: grid;
  grid-template-rows: auto 1fr;

  .MuiTabs-root {
    padding: 0px 20px;
    border-bottom: 1px solid #dededede;
  }
`;

const TabContainer = styled.div`
  padding: 20px;
  overflow-y: auto;
`;

export const ImportExportView = memo(
  ({
    title,
    endpoint,
    dataTypes,
    dataTypesSelectable,
    buildTabs,
    defaultTab,
    ImportButton,
    ExportButton,
  }) => {
    const [currentTab, setCurrentTab] = useState(defaultTab || 'import');
    const [isLoading, setIsLoading] = useState(false);

    const importTab = useMemo(
      () => ({
        label: <TranslatedText
          stringId="admin.import.title"
          fallback="Import"
          data-testid='translatedtext-6mv4' />,
        key: 'import',
        icon: 'fa fa-file-import',
        render: () => (
          <TabContainer data-testid='tabcontainer-romz'>
            <ImporterView
              endpoint={endpoint}
              dataTypes={dataTypes}
              dataTypesSelectable={dataTypesSelectable}
              setIsLoading={setIsLoading}
              ImportButton={ImportButton}
              data-testid='importerview-o1ew' />
          </TabContainer>
        ),
      }),
      [endpoint, dataTypes, dataTypesSelectable, ImportButton],
    );

    const exportTab = useMemo(
      () => ({
        label: <TranslatedText
          stringId="admin.export.title"
          fallback="Export"
          data-testid='translatedtext-bp3j' />,
        key: 'export',
        icon: 'fa fa-file-export',
        render: () => (
          <TabContainer data-testid='tabcontainer-bojy'>
            <ExporterView
              title={title}
              endpoint={endpoint}
              dataTypes={dataTypes}
              dataTypesSelectable={dataTypesSelectable}
              setIsLoading={setIsLoading}
              ExportButton={ExportButton}
              data-testid='exporterview-8w7t' />
          </TabContainer>
        ),
      }),
      [title, endpoint, dataTypes, dataTypesSelectable, ExportButton],
    );

    const tabs = buildTabs ? buildTabs(importTab, exportTab) : [importTab, exportTab];

    return (
      <AdminViewContainer
        title={title}
        showLoadingIndicator={isLoading}
        data-testid='adminviewcontainer-8mti'>
        <StyledTabDisplay
          tabs={tabs}
          currentTab={currentTab}
          onTabSelect={setCurrentTab}
          scrollable={false}
          data-testid='styledtabdisplay-cd6a' />
      </AdminViewContainer>
    );
  },
);
