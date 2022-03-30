import React, { useCallback, useState } from 'react';
import { extension } from 'mime-types';
import { promises as asyncFs } from 'fs';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';
import { DeleteButton } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { useElectron } from '../contexts/Electron';
import { useApi } from '../api';
import { notify, notifySuccess, notifyError } from '../utils';

const ActionDropdown = React.memo(({ row }) => {
  const [open, setOpen] = useState(false);
  const { showSaveDialog, openPath } = useElectron();
  const api = useApi();
  const onClose = useCallback(() => setOpen(false), []);
  const onDeleteDocument = useCallback(() => {
    console.log('Delete document TBD');
    onClose();
  }, [onClose]);
  const onDownloadDocument = async () => {
    // Suggest a filename that matches the document name
    const path = await showSaveDialog({ defaultPath: row.name });
    if (path.canceled) return;

    // If the extension is unknown, save it without extension
    const fileExtension = extension(row.type);
    const fullFilePath = fileExtension ? `${path.filePath}.${fileExtension}` : path.filePath;

    try {
      // Give feedback to user that download is starting
      notify('Your download has started, please wait.', { type: 'info' });

      // Download attachment (*currently the API only supports base64 responses)
      const { data } = await api.get(`attachment/${row.attachmentId}`, { base64: true });

      // Create file and open it
      await asyncFs.writeFile(fullFilePath, data, { encoding: 'base64' });
      notifySuccess(`Successfully downloaded file at: ${fullFilePath}`);
      openPath(fullFilePath);
    } catch (error) {
      notifyError(error.message);
    }
  };

  const actions = [
    {
      label: 'Download',
      onClick: onDownloadDocument,
    },
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
      <ConfirmModal
        open={open}
        title="Delete document"
        text="WARNING: This action is irreversible!"
        subText="Are you sure you want to delete this document?"
        onConfirm={onDeleteDocument}
        onCancel={onClose}
        ConfirmButton={DeleteButton}
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
const getDepartmentName = ({ department }) => department?.name || '';
const getActions = row => <ActionDropdown row={row} />;
const COLUMNS = [
  { key: 'name', title: 'Name' },
  { key: 'type', title: 'Type', accessor: getType },
  { key: 'documentUploadedAt', title: 'Upload', accessor: getUploadedDate },
  { key: 'documentOwner', title: 'Owner' },
  { key: 'department.name', title: 'Department', accessor: getDepartmentName, sortable: false },
  { key: 'note', title: 'Comments', sortable: false },
  {
    key: 'actions',
    title: 'Actions',
    accessor: getActions,
    dontCallRowInput: true,
    sortable: false,
  },
];

export const DocumentsTable = React.memo(({ endpoint, searchParameters, refreshCount }) => (
  <DataFetchingTable
    endpoint={endpoint}
    columns={COLUMNS}
    noDataMessage="No documents found"
    fetchOptions={searchParameters}
    refreshCount={refreshCount}
  />
));
