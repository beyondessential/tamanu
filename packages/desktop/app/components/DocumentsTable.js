import React, { useCallback, useState, useMemo } from 'react';
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

const ActionDropdown = React.memo(({ row, onDownload, onClickDelete }) => {
  const actions = [
    {
      label: 'Download',
      onClick: () => onDownload(row),
    },
    {
      label: 'Delete',
      onClick: () => onClickDelete(row.id),
    },
    {
      label: 'Attach to care plan',
      onClick: () => console.log('clicked attach to care plan'),
    },
  ];

  return <DropdownButton color="primary" actions={actions} />;
});

const getType = ({ type }) => {
  const fileExtension = extension(type);
  if (typeof fileExtension === 'string') return fileExtension.toUpperCase();
  return 'Unknown';
};
const getUploadedDate = ({ documentUploadedAt }) =>
  documentUploadedAt ? <DateDisplay date={documentUploadedAt} /> : '';
const getDepartmentName = ({ department }) => department?.name || '';
const getActions = (row, onDownload, onClickDelete) => (
  <ActionDropdown row={row} onDownload={onDownload} onClickDelete={onClickDelete} />
);

export const DocumentsTable = React.memo(({ endpoint, searchParameters, refreshCount }) => {
  const { showSaveDialog, openPath } = useElectron();
  const api = useApi();

  // Confirm delete modal will be open/close if it has a document ID
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const onClose = useCallback(() => setSelectedDocumentId(null), []);

  // Deletes selected document on confirmation (TBD)
  const onConfirmDelete = useCallback(() => {
    console.log('Delete document TBD', selectedDocumentId);
    onClose();
  }, [selectedDocumentId, onClose]);

  // Callbacks invoked inside getActions
  const onClickDelete = useCallback(id => setSelectedDocumentId(id), []);
  const onDownload = useCallback(
    async row => {
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
    },
    [api, openPath, showSaveDialog],
  );

  // Define columns inside component to pass callbacks to getActions
  const COLUMNS = useMemo(() => {
    return [
      { key: 'name', title: 'Name' },
      { key: 'type', title: 'Type', accessor: getType },
      { key: 'documentUploadedAt', title: 'Upload', accessor: getUploadedDate },
      { key: 'documentOwner', title: 'Owner' },
      {
        key: 'department.name',
        title: 'Department',
        accessor: getDepartmentName,
        sortable: false,
      },
      { key: 'note', title: 'Comments', sortable: false },
      {
        key: 'actions',
        title: 'Actions',
        accessor: row => getActions(row, onDownload, onClickDelete),
        dontCallRowInput: true,
        sortable: false,
      },
    ];
  }, [onDownload, onClickDelete]);

  return (
    <>
      <DataFetchingTable
        endpoint={endpoint}
        columns={COLUMNS}
        noDataMessage="No documents found"
        fetchOptions={searchParameters}
        refreshCount={refreshCount}
      />
      <ConfirmModal
        open={selectedDocumentId !== null}
        title="Delete document"
        text="WARNING: This action is irreversible!"
        subText="Are you sure you want to delete this document?"
        onConfirm={onConfirmDelete}
        onCancel={onClose}
        ConfirmButton={DeleteButton}
      />
    </>
  );
});
