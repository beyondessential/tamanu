import ms from 'ms';
import React from 'react';
import { Box } from '@material-ui/core';

import { DataFetchingTable, DateDisplay, PageContainer, TopBar } from '../../components';
import { SYNC_LAST_COMPLETED_ENDPOINT } from './constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const LastSyncs = React.memo(props => (
  <DataFetchingTable
    endpoint={SYNC_LAST_COMPLETED_ENDPOINT}
    columns={[
      {
        key: 'facilityIds',
        title: <TranslatedText
          stringId="general.facility.label.plural"
          fallback="Facilities"
          data-test-id='translatedtext-91r2' />,
        minWidth: 100,
        accessor: ({ facilityIds }) => facilityIds.join(', '),
      },
      {
        key: 'completedAt',
        title: (
          <TranslatedText
            stringId="admin.syncStatus.table.column.lastCompleted"
            fallback="Last completed sync"
            data-test-id='translatedtext-tnhf' />
        ),
        accessor: ({ completedAt }) => <DateDisplay date={completedAt} showTime data-test-id='datedisplay-yez8' />,
      },
      {
        key: 'duration',
        title: (
          <TranslatedText
            stringId="admin.syncStatus.table.column.duration."
            fallback="Duration"
            data-test-id='translatedtext-i9wd' />
        ),
        accessor: ({ duration }) => ms(duration),
      },
    ]}
    noDataMessage={<TranslatedText
      stringId="general.table.noData"
      fallback="No data"
      data-test-id='translatedtext-zzl7' />}
    {...props}
    data-test-id='datafetchingtable-8g5k' />
));

export const SyncView = React.memo(() => {
  return (
    <PageContainer>
      <TopBar
        title={<TranslatedText
          stringId="admin.syncStatus.title"
          fallback="Sync status"
          data-test-id='translatedtext-io3n' />}
        data-test-id='topbar-6yi6' />
      <Box p={4}>
        <p data-test-id='p-nzaf'>
          <TranslatedText
            stringId="admin.syncStatus.times.message"
            fallback="Times are in the server's timezone"
            data-test-id='translatedtext-8i9o' />
        </p>
        <LastSyncs />
      </Box>
    </PageContainer>
  );
});
