import ms from 'ms';
import React from 'react';
import { Box } from '@material-ui/core';

import { DataFetchingTable, DateDisplay, PageContainer, TopBar } from '../../components';
import { SYNC_LAST_COMPLETED_ENDPOINT } from './constants';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const LastSyncs = React.memo((props) => (
  <DataFetchingTable
    endpoint={SYNC_LAST_COMPLETED_ENDPOINT}
    columns={[
      {
        key: 'facilityIds',
        title: (
          <TranslatedText
            stringId="general.facility.label.plural"
            fallback="Facilities"
            data-testid="translatedtext-sowk"
          />
        ),
        minWidth: 100,
        accessor: ({ facilityIds }) => facilityIds.join(', '),
      },
      {
        key: 'completedAt',
        title: (
          <TranslatedText
            stringId="admin.syncStatus.table.column.lastCompleted"
            fallback="Last completed sync"
            data-testid="translatedtext-zsv1"
          />
        ),
        accessor: ({ completedAt }) => (
          <DateDisplay date={completedAt} showTime data-testid="datedisplay-fz4d" />
        ),
      },
      {
        key: 'duration',
        title: (
          <TranslatedText
            stringId="admin.syncStatus.table.column.duration."
            fallback="Duration"
            data-testid="translatedtext-frcu"
          />
        ),
        accessor: ({ duration }) => ms(duration),
      },
    ]}
    noDataMessage={
      <TranslatedText
        stringId="general.table.noData"
        fallback="No data"
        data-testid="translatedtext-sl88"
      />
    }
    {...props}
    data-testid="datafetchingtable-cql7"
  />
));

export const SyncView = React.memo(() => {
  return (
    <PageContainer data-testid="pagecontainer-2l0x">
      <TopBar
        title={
          <TranslatedText
            stringId="admin.syncStatus.title"
            fallback="Sync status"
            data-testid="translatedtext-x7f4"
          />
        }
        data-testid="topbar-oo6b"
      />
      <Box p={4} data-testid="box-asob">
        <p>
          <TranslatedText
            stringId="admin.syncStatus.times.message"
            fallback="Times are in the server's timezone"
            data-testid="translatedtext-6i96"
          />
        </p>
        <LastSyncs data-testid="lastsyncs-ztc3" />
      </Box>
    </PageContainer>
  );
});
