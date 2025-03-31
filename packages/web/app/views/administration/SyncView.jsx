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
          data-testid='translatedtext-91r2' />,
        minWidth: 100,
        accessor: ({ facilityIds }) => facilityIds.join(', '),
      },
      {
        key: 'completedAt',
        title: (
          <TranslatedText
            stringId="admin.syncStatus.table.column.lastCompleted"
            fallback="Last completed sync"
            data-testid='translatedtext-tnhf' />
        ),
        accessor: ({ completedAt }) => <DateDisplay date={completedAt} showTime data-testid='datedisplay-yez8' />,
      },
      {
        key: 'duration',
        title: (
          <TranslatedText
            stringId="admin.syncStatus.table.column.duration."
            fallback="Duration"
            data-testid='translatedtext-i9wd' />
        ),
        accessor: ({ duration }) => ms(duration),
      },
    ]}
    noDataMessage={<TranslatedText
      stringId="general.table.noData"
      fallback="No data"
      data-testid='translatedtext-zzl7' />}
    {...props}
    data-testid='datafetchingtable-8g5k' />
));

export const SyncView = React.memo(() => {
  return (
    <PageContainer>
      <TopBar
        title={<TranslatedText
          stringId="admin.syncStatus.title"
          fallback="Sync status"
          data-testid='translatedtext-io3n' />}
        data-testid='topbar-6yi6' />
      <Box p={4}>
        <p data-testid='p-nzaf'>
          <TranslatedText
            stringId="admin.syncStatus.times.message"
            fallback="Times are in the server's timezone"
            data-testid='translatedtext-8i9o' />
        </p>
        <LastSyncs />
      </Box>
    </PageContainer>
  );
});
