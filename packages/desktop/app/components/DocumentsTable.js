import React, { useCallback, useState } from 'react';
import { extension } from 'mime-types';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';
import { WarningModal } from './WarningModal';

const ActionDropdown = React.memo(() => {
  const [open, setOpen] = useState(false);
  const onClose = useCallback(() => setOpen(false), []);
  const onDeleteDocument = useCallback(() => {
    console.log('Delete document TBD');
    onClose();
  }, [onClose]);

  const actions = [
    {
      label: 'Delete',
      onClick: () => setOpen(true),
    },
    {
      label: 'Attach to care plan',
      onClick: () => console.log('clicked attach to care plan'),
    },
  ];

  return (
    <>
      <DropdownButton color="primary" actions={actions} />
      <WarningModal
        open={open}
        title="Delete document"
        text="Are you sure you want to delete this document?"
        onConfirm={onDeleteDocument}
        onClose={onClose}
      />
    </>
  );
});

const getType = ({ type }) => {
  const fileExtension = extension(type);
  if (typeof fileExtension === 'string') return fileExtension.toUpperCase();
  return 'Unknown';
};
const getUploadedDate = ({ documentUploadedAt }) =>
  documentUploadedAt ? <DateDisplay date={documentUploadedAt} /> : '';
const getDisplayName = ({ documentOwner }) => documentOwner?.displayName || '';
const getDepartmentName = ({ departmentId }) => departmentId?.name || '';
const getActions = ({ row }) => <ActionDropdown row={row} />;

const COLUMNS = [
  { key: 'name', title: 'Name' },
  { key: 'type', title: 'Type', accessor: getType },
  { key: 'document_uploaded_at', title: 'Upload', accessor: getUploadedDate },
  { key: 'document_owner', title: 'Owner', accessor: getDisplayName },
  { key: 'department_id', title: 'Department', accessor: getDepartmentName, sortable: false },
  { key: 'note', title: 'Comments', sortable: false },
  {
    key: 'actions',
    title: 'Actions',
    accessor: getActions,
    dontCallRowInput: true,
    sortable: false,
  },
];

export const DocumentsTable = React.memo(({ encounterId, patientId, searchParameters }) => {
  const endpoint = encounterId
    ? `encounter/${encounterId}/documentMetadata`
    : `patient/${patientId}/documentMetadata`;

  return (
    <DataFetchingTable
      endpoint={endpoint}
      columns={COLUMNS}
      noDataMessage="No documents found"
      fetchOptions={searchParameters}
    />
  );
});
