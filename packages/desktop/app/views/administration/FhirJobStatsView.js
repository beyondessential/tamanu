import React from 'react';
import { TopBar, PageContainer, ContentPane, DataFetchingTable } from '../../components';
import { FHIR_JOB_STATS_ENDPOINT } from './constants';

export const FhirJobStatsView = () => {
  return (
    <PageContainer>
      <TopBar title="FHIR job stats" />
      <ContentPane>
        <p>Warning: this query can be slow with a large number of FHIR jobs</p>
        <DataFetchingTable
          endpoint={FHIR_JOB_STATS_ENDPOINT}
          disablePagination
          columns={[
            {
              key: 'topic',
              title: 'Topic',
            },
            {
              key: 'status',
              title: 'Status',
            },
            {
              key: 'count',
              title: 'Count',
            },
          ]}
          noDataMessage="No data"
        />
      </ContentPane>
    </PageContainer>
  );
};
