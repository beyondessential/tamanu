import React from 'react';
import { getStatus } from '../../../utils/lab';
import { DateDisplay, DataFetchingTable, Modal } from '../../../components';

const COLUMNS = [
  {
    key: 'createdAt',
    title: 'Date',
    accessor: ({ createdAt }) => <DateDisplay date={createdAt} />,
  },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'updatedByDisplayName', title: 'Officer' },
];

// Todo: Add custom styled in WAITM-648
export const LabRequestLogModal = ({ open, onClose, labRequest }) => {
  return (
    <Modal open={open} onClose={onClose} title="Status log" width="md">
      <DataFetchingTable
        columns={COLUMNS}
        endpoint={`labRequestLog/labRequest/${labRequest.id}`}
        allowExport={false}
      />
    </Modal>
  );
};
