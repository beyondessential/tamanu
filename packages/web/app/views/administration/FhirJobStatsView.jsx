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
          data-test-id='translatedtext-81px' />}
        data-test-id='topbar-l23w' />
      <ContentPane>
        <p data-test-id='p-6nh9'>
          <TranslatedText
            stringId="admin.fhir.warning"
            fallback="Warning: this query can be slow with a large number of FHIR jobs"
            data-test-id='translatedtext-qh3l' />
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
                data-test-id='translatedtext-1qy6' />,
            },
            {
              key: 'status',
              title: <TranslatedText
                stringId="general.table.column.status"
                fallback="Status"
                data-test-id='translatedtext-0hq6' />,
            },
            {
              key: 'count',
              title: <TranslatedText
                stringId="admin.fhir.table.column.count"
                fallback="Count"
                data-test-id='translatedtext-wmow' />,
            },
          ]}
          noDataMessage={<TranslatedText
            stringId="general.table.noData"
            fallback="No data"
            data-test-id='translatedtext-jygx' />}
          data-test-id='datafetchingtable-pg35' />
      </ContentPane>
    </PageContainer>
  );
};
