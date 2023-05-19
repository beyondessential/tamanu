import ms from 'ms';
import React from 'react';

import { TopBar, PageContainer, DataFetchingTable, DateDisplay } from '../../components';
import { SYNC_LAST_COMPLETED_ENDPOINT } from './constants';

const LastSyncs = React.memo(props => (
  <DataFetchingTable
    endpoint={SYNC_LAST_COMPLETED_ENDPOINT}
    columns={[
      {
        key: 'facilityId',
        title: 'Facility',
        minWidth: 100,
      },
      {
        key: 'completedAt',
        title: 'Last completed sync',
        accessor: ({ completedAt }) => <DateDisplay date={completedAt} showTime />,
      },
      {
        key: 'duration',
        title: 'Duration',
        accessor: ({ duration }) => ms(duration),
      },
    ]}
    noDataMessage="No data"
    {...props}
  />
));

export const SyncView = React.memo(() => {
  return (
    <PageContainer>
      <TopBar title="Sync status" />
      <p>{`Times are in the server's timezone.`}</p>
      <LastSyncs />
    </PageContainer>
  );
});
