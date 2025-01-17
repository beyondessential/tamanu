import React from 'react';
import { ContentPane, DataFetchingTable, TopBar } from '../../components';
import { FHIR_JOB_STATS_ENDPOINT } from './constants';
import { TranslatedText } from '../../components/Translation';

export const FhirJobStatsView = () => {
  return (
    <div>
      <TopBar title={<TranslatedText stringId="admin.fhir.title" fallback="FHIR job stats" />} />
      <ContentPane>
        <p>
          <TranslatedText
            stringId="admin.fhir.warning"
            fallback="Warning: this query can be slow with a large number of FHIR jobs"
          />
        </p>
        <DataFetchingTable
          endpoint={FHIR_JOB_STATS_ENDPOINT}
          disablePagination
          columns={[
            {
              key: 'topic',
              title: <TranslatedText stringId="admin.fhir.table.column.topic" fallback="Topic" />,
            },
            {
              key: 'status',
              title: <TranslatedText stringId="general.table.column.status" fallback="Status" />,
            },
            {
              key: 'count',
              title: <TranslatedText stringId="admin.fhir.table.column.count" fallback="Count" />,
            },
          ]}
          noDataMessage={<TranslatedText stringId="general.table.noData" fallback="No data" />}
        />
      </ContentPane>
    </div>
  );
};
