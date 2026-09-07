import React, { useState } from 'react';
import styled from 'styled-components';
import { Button, MultilineDatetimeDisplay, TranslatedText } from '@tamanu/ui-components';

import { ContentPane, PageContainer, Table, TopBar } from '../../components';
import { useClientSideTableData } from '../../components/Table/useClientSideTableData';
import { Colors } from '../../constants';
import { SendErrorLogButtonLabel, SendErrorLogModal } from './SendErrorLogModal';

const NoDataContainer = styled.div`
  height: 200px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.hoverGrey};
  color: ${Colors.primary};
`;

// Mock data standing in until the real store for relegated system errors is built
// (see `relegateSystemError`) — timestamps are relative to load time so the table
// always shows something recent to demonstrate sorting against.
const hoursAgo = hours => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const MOCK_SYSTEM_ERRORS = [
  {
    id: '1',
    timestamp: hoursAgo(0.2),
    message:
      'Something went wrong on the server. Path: patient/123. Message: Unexpected token in JSON',
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
  {
    id: '4',
    timestamp: hoursAgo(11),
    message:
      'Something went wrong on the server. Path: encounter/456. Message: Unexpected server error',
  },
  {
    id: '5',
    timestamp: hoursAgo(13),
    message:
      'Something went wrong on the server. Path: medication/789. Message: Unexpected server error',
  },
  {
    id: '6',
    timestamp: hoursAgo(15),
    message:
      'Something went wrong on the server. Path: imaging/orders. Message: Unexpected server error',
  },
  {
    id: '7',
    timestamp: hoursAgo(17),
    message:
      'Something went wrong on the server. Path: vaccine/schedule. Message: Unexpected server error',
  },
  {
    id: '8',
    timestamp: hoursAgo(19),
    message:
      'Something went wrong on the server. Path: invoice/234. Message: Unexpected server error',
  },
  {
    id: '9',
    timestamp: hoursAgo(21),
    message:
      'Something went wrong on the server. Path: programRegistry/enrol. Message: Unexpected server error',
  },
  {
    id: '10',
    timestamp: hoursAgo(23),
    message:
      'Something went wrong on the server. Path: patient/search. Message: Unexpected server error',
  },
  {
    id: '11',
    timestamp: hoursAgo(25),
    message:
      'Something went wrong on the server. Path: survey/response. Message: Unexpected server error',
  },
  {
    id: '12',
    timestamp: hoursAgo(27),
    message:
      'Something went wrong on the server. Path: user/tasks. Message: Unexpected server error',
  },
  {
    id: '13',
    timestamp: hoursAgo(29),
    message:
      'Something went wrong on the server. Path: facility/locations. Message: Unexpected server error',
  },
  {
    id: '14',
    timestamp: hoursAgo(31),
    message:
      'Something went wrong on the server. Path: reports/generate. Message: Unexpected server error',
  },
  {
    id: '15',
    timestamp: hoursAgo(33),
    message:
      'Something went wrong on the server. Path: sync/pull. Message: Unexpected server error',
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

  const {
    pageData,
    count,
    orderBy,
    order,
    onChangeOrderBy,
    page,
    rowsPerPage,
    onChangePage,
    onChangeRowsPerPage,
  } = useClientSideTableData(errors, {
    initialSortKey: 'timestamp',
    initialSortDirection: 'desc',
  });

  return (
    <PageContainer>
      <TopBar title={<TranslatedText stringId="systemErrors.title" fallback="System errors" />}>
        <Button color="primary" onClick={() => setIsSendLogModalOpen(true)}>
          <SendErrorLogButtonLabel count={errors.length} />
        </Button>
      </TopBar>
      <ContentPane>
        <Table
          data={pageData}
          columns={COLUMNS}
          noDataMessage={
            <NoDataContainer data-testid="nodatacontainer-syse">
              <TranslatedText
                stringId="systemErrors.table.noData"
                fallback="No system errors to display"
              />
            </NoDataContainer>
          }
          statusCellStyle="&.MuiTableCell-body { padding: 20px; }"
          onChangeOrderBy={onChangeOrderBy}
          orderBy={orderBy}
          order={order}
          page={page}
          count={count}
          rowsPerPage={rowsPerPage}
          onChangePage={onChangePage}
          onChangeRowsPerPage={onChangeRowsPerPage}
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
