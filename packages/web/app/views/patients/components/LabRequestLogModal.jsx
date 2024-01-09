import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { getStatus } from '../../../utils/lab';
import { DateDisplay, Table, Modal, ModalLoader } from '../../../components';
import { useApi } from '../../../api';

const COLUMNS = [
  {
    key: 'createdAt',
    title: 'Date & time',
    accessor: ({ createdAt }) => <DateDisplay date={createdAt} showTime />,
  },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'updatedByDisplayName', title: 'Recorded by' },
];

const StyledTable = styled(Table)`
  margin: 30px auto 50px;
  border: none;
  padding: 5px 20px 10px;

  table thead th {
    background: white;
  }
  table tbody td.MuiTableCell-body {
    padding-top: 10px;
    padding-bottom: 10px;
    border: none;
  }
  table tbody tr:first-child td.MuiTableCell-body {
    padding-top: 15px;
  }
`;

export const LabRequestLogModal = ({ open, onClose, labRequest }) => {
  const api = useApi();
  const { isLoading, data } = useQuery(['labRequestLog', labRequest.id], () =>
    api.get(`labRequestLog/labRequest/${labRequest.id}`),
  );

  return (
    <Modal open={open} onClose={onClose} title="Status Log" width="md">
      {isLoading ? (
        <ModalLoader />
      ) : (
        <StyledTable columns={COLUMNS} data={data?.data} allowExport={false} elevated={false} />
      )}
    </Modal>
  );
};
