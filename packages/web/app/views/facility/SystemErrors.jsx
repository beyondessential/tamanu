import React, { useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
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
  const errors = useSelector(state => state.systemErrors.errors);
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
