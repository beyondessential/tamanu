import ms from 'ms';
import React from 'react';

import { DataFetchingTable, DateDisplay, PageContainer, TopBar } from '../../components';
import { SYNC_LAST_COMPLETED_ENDPOINT } from './constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const LastSyncs = React.memo(props => (
  <DataFetchingTable
    endpoint={SYNC_LAST_COMPLETED_ENDPOINT}
    columns={[
      {
        key: 'facilityId',
        title: <TranslatedText stringId="general.facility.label" fallback="Facility" />,
        minWidth: 100,
      },
      {
        key: 'completedAt',
        title: (
          <TranslatedText
            stringId="admin.syncStatus.table.column.lastCompleted"
            fallback="Last completed sync"
          />
        ),
        accessor: ({ completedAt }) => <DateDisplay date={completedAt} showTime />,
      },
      {
        key: 'duration',
        title: (
          <TranslatedText stringId="admin.syncStatus.table.column.duration." fallback="Duration" />
        ),
        accessor: ({ duration }) => ms(duration),
      },
    ]}
    noDataMessage={<TranslatedText stringId="general.table.noData" fallback="No data" />}
    {...props}
  />
));

export const SyncView = React.memo(() => {
  return (
    <PageContainer>
      <TopBar title={<TranslatedText stringId="admin.syncStatus.title" fallback="Sync status" />} />
      <p>
        <TranslatedText
          stringId="admin.syncStatus.times.message"
          fallback="Times are in the server's timezone"
        />
      </p>
      <LastSyncs />
    </PageContainer>
  );
});
