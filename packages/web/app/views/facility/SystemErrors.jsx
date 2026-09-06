import React, { useState } from 'react';
import { Button, MultilineDatetimeDisplay, TranslatedText } from '@tamanu/ui-components';

import { ContentPane, PageContainer, Table, TopBar } from '../../components';
import { useTableSorting } from '../../components/Table/useTableSorting';
import { SendErrorLogButtonLabel, SendErrorLogModal } from './SendErrorLogModal';

const DEFAULT_ROWS_PER_PAGE = 25;

// Mock data standing in until the real store for relegated system errors is built
// (see `relegateSystemError`) — timestamps are relative to load time so the table
// always shows something recent to demonstrate sorting against.
const hoursAgo = hours => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const MOCK_SYSTEM_ERRORS = [
  {
    id: '1',
    timestamp: hoursAgo(0.2),
    message: 'Something went wrong on the server. Path: patient/123. Message: Unexpected token in JSON',
  },
  {
    id: '2',
    timestamp: hoursAgo(3),
    message:
      'Something went wrong on the server. Path: labRequest/all. Message: Connection terminated unexpectedly',
  },
  {
    id: '3',
    timestamp: hoursAgo(9),
    message:
      'Something went wrong on the server. Path: appointments/outpatients. Message: relation "appointments" does not exist',
  },
];

export const COLUMNS = [
  {
    key: 'timestamp',
    title: <TranslatedText stringId="systemErrors.table.column.dateTime" fallback="Date & time" />,
    accessor: row => <MultilineDatetimeDisplay date={row.timestamp} />,
  },
  {
    key: 'message',
    title: (
      <TranslatedText stringId="systemErrors.table.column.errorMessage" fallback="Error message" />
    ),
  },
];

export const SystemErrors = React.memo(() => {
  const [errors] = useState(MOCK_SYSTEM_ERRORS);
  const [isSendLogModalOpen, setIsSendLogModalOpen] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const { orderBy, order, onChangeOrderBy, customSort } = useTableSorting({
    initialSortKey: 'timestamp',
    initialSortDirection: 'desc',
  });

  return (
    <PageContainer>
      <TopBar title={<TranslatedText stringId="systemErrors.title" fallback="System errors" />}>
        <Button
          color="primary"
          onClick={() => setIsSendLogModalOpen(true)}
        >
          <SendErrorLogButtonLabel count={errors.length} />
        </Button>
      </TopBar>
      <ContentPane>
        <Table
          data={errors}
          columns={COLUMNS}
          noDataMessage={
            <TranslatedText
              stringId="systemErrors.table.noData"
              fallback="No system errors to display"
            />
          }
          onChangeOrderBy={onChangeOrderBy}
          customSort={customSort}
          orderBy={orderBy}
          order={order}
          page={page}
          count={errors.length}
          rowsPerPage={rowsPerPage}
          onChangePage={setPage}
          onChangeRowsPerPage={setRowsPerPage}
        />
      </ContentPane>
      <SendErrorLogModal
        open={isSendLogModalOpen}
        onClose={() => setIsSendLogModalOpen(false)}
        errors={errors}
      />
    </PageContainer>
  );
});
