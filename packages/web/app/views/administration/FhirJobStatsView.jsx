import React from 'react';
import { ContentPane, DataFetchingTable, PageContainer, TopBar } from '../../components';
import { FHIR_JOB_STATS_ENDPOINT } from './constants';
import { TranslatedText } from '../../components/Translation';

export const FhirJobStatsView = () => {
  return (
    <PageContainer data-testid='pagecontainer-4djs'>
      <TopBar
        title={<TranslatedText
          stringId="admin.fhir.title"
          fallback="FHIR job stats"
          data-testid='translatedtext-e83j' />}
        data-testid='topbar-7rad' />
      <ContentPane data-testid='contentpane-pzed'>
        <p>
          <TranslatedText
            stringId="admin.fhir.warning"
            fallback="Warning: this query can be slow with a large number of FHIR jobs"
            data-testid='translatedtext-1ux6' />
        </p>
        <DataFetchingTable
          endpoint={FHIR_JOB_STATS_ENDPOINT}
          disablePagination
          columns={[
            {
              key: 'topic',
              title: <TranslatedText
                stringId="admin.fhir.table.column.topic"
                fallback="Topic"
                data-testid='translatedtext-zzze' />,
            },
            {
              key: 'status',
              title: <TranslatedText
                stringId="general.table.column.status"
                fallback="Status"
                data-testid='translatedtext-1dva' />,
            },
            {
              key: 'count',
              title: <TranslatedText
                stringId="admin.fhir.table.column.count"
                fallback="Count"
                data-testid='translatedtext-l7yo' />,
            },
          ]}
          noDataMessage={<TranslatedText
            stringId="general.table.noData"
            fallback="No data"
            data-testid='translatedtext-bpxj' />}
          data-testid='datafetchingtable-9po5' />
      </ContentPane>
    </PageContainer>
  );
};
