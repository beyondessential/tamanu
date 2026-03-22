import React from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { getStatus } from '../../../utils/lab';
import { DateDisplay, Table } from '../../../components';
import { useApi } from '../../../api';
import { TranslatedText, Modal, ModalLoader } from '@tamanu/ui-components';


const COLUMNS = [
  {
    key: 'createdAt',
    title: (
      <TranslatedText
        stringId="general.dateAndTime.label"
        fallback="Date & time"
        data-testid="translatedtext-lab-modal-log-column-datetime"
      />
    ),
    accessor: ({ createdAt }) => (
      <DateDisplay date={createdAt} timeFormat="default" data-testid="datedisplay-0e5f" />
    ),
  },
  {
    key: 'status',
    title: (
      <TranslatedText
        stringId="lab.modal.log.column.status"
        fallback="Status"
        data-testid="translatedtext-lab-modal-log-column-status"
      />
    ),
    accessor: getStatus,
  },
  {
    key: 'updatedByDisplayName',
    title: (
      <TranslatedText
        stringId="lab.modal.log.column.recordedBy"
        fallback="Recorded by"
        data-testid="translatedtext-lab-modal-log-column-recordedby"
      />
    ),
  },
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
    <Modal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="lab.modal.log.title"
          fallback="Status Log"
          data-testid="translatedtext-lab-modal-log-title"
        />
      }
      width="md"
      data-testid="modal-ut08"
    >
      {isLoading ? (
        <ModalLoader data-testid="modalloader-dxm4" />
      ) : (
        <StyledTable
          columns={COLUMNS}
          data={data?.data}
          allowExport={false}
          elevated={false}
          data-testid="styledtable-ma21"
        />
      )}
    </Modal>
  );
};
