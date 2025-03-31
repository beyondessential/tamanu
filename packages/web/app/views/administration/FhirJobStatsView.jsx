import React from 'react';
import { ContentPane, DataFetchingTable, PageContainer, TopBar } from '../../components';
import { FHIR_JOB_STATS_ENDPOINT } from './constants';
import { TranslatedText } from '../../components/Translation';

export const FhirJobStatsView = () => {
  return (
    <PageContainer>
      <TopBar
        title={<TranslatedText
          stringId="admin.fhir.title"
          fallback="FHIR job stats"
          data-testid='translatedtext-81px' />}
        data-testid='topbar-l23w' />
      <ContentPane>
        <p data-testid='p-6nh9'>
          <TranslatedText
            stringId="admin.fhir.warning"
            fallback="Warning: this query can be slow with a large number of FHIR jobs"
            data-testid='translatedtext-qh3l' />
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
                data-testid='translatedtext-1qy6' />,
            },
            {
              key: 'status',
              title: <TranslatedText
                stringId="general.table.column.status"
                fallback="Status"
                data-testid='translatedtext-0hq6' />,
            },
            {
              key: 'count',
              title: <TranslatedText
                stringId="admin.fhir.table.column.count"
                fallback="Count"
                data-testid='translatedtext-wmow' />,
            },
          ]}
          noDataMessage={<TranslatedText
            stringId="general.table.noData"
            fallback="No data"
            data-testid='translatedtext-jygx' />}
          data-testid='datafetchingtable-pg35' />
      </ContentPane>
    </PageContainer>
  );
};
