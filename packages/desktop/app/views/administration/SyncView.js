import React from 'react';
import { TopBar, PageContainer, DataFetchingTable, DateDisplay } from '../../components';
import { SYNC_LAST_COMPLETED_ENDPOINT } from './constants';

const getTimestamp = ({ timestamp }) => <DateDisplay date={timestamp} showTime />;

const LastSyncs = React.memo(({ ...props }) => (
  <DataFetchingTable
    endpoint={SYNC_LAST_COMPLETED_ENDPOINT}
    columns={[
      {
        key: 'facility',
        title: 'Facility',
        minWidth: 100,
      },
      {
        key: 'timestamp',
        title: 'Last completed sync',
        minWidth: 100,
        accessor: getTimestamp,
      },
    ]}
    noDataMessage="No data"
    {...props}
  />
));

export const SyncView = React.memo(() => {
  return (
    <PageContainer>
      <TopBar title="Sync status"></TopBar>
      <LastSyncs fetchOptions={{}} />
    </PageContainer>
  );
});
