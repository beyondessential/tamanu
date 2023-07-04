import React, { useCallback, useState, useMemo } from 'react';
import { extension } from 'mime-types';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DropdownButton } from './DropdownButton';
import { DeleteButton } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { useApi } from '../api';
import { notify, notifySuccess, notifyError } from '../utils';

// eslint-disable-next-line no-unused-vars
const ActionDropdown = React.memo(({ row, onDownload, onClickDelete }) => {
  // { row, onDownload, onClickDelete }
  const actions = [
    {
      label: 'Download',
      onClick: () => onDownload(row),
    },
    // Currently delete and attach to care plan aren't built, so we'll hide them
    /*
    {
      label: 'Delete',
      onClick: () => onClickDelete(row.id),
    },
    {
      label: 'Attach to care plan',
      onClick: () => console.log('clicked attach to care plan'),
    },
    */
  ];

  return <DropdownButton actions={actions} variant="outlined" size="small" />;
});

const getType = ({ type }) => {
  const fileExtension = extension(type);
  if (typeof fileExtension === 'string') return fileExtension.toUpperCase();
  return 'Unknown';
};
const getUploadedDate = ({ documentUploadedAt }) =>
  documentUploadedAt ? <DateDisplay date={documentUploadedAt} /> : '';
const getDepartmentName = ({ department }) => department?.name || '';

export const DocumentsTable = React.memo(
  ({ endpoint, searchParameters, refreshCount, canInvokeDocumentAction, elevated }) => {
    const api = useApi();

    // Confirm delete modal will be open/close if it has a document ID
    const [selectedDocumentId, setSelectedDocumentId] = useState(null);
    const onClose = useCallback(() => setSelectedDocumentId(null), []);

    // Deletes selected document on confirmation (TBD)
    const onConfirmDelete = useCallback(() => {
      // Only perform deletion if there is internet connection
      if (canInvokeDocumentAction()) {
        console.log('Delete document TBD', selectedDocumentId); // eslint-disable-line no-console
      }

      // Close modal either way
      onClose();
    }, [selectedDocumentId, onClose, canInvokeDocumentAction]);

    // Callbacks invoked inside getActions
    const onClickDelete = useCallback(id => setSelectedDocumentId(id), []);
    const onDownload = useCallback(
      async row => {
        /*
        // Modal error will be set and shouldn't continue download
        if (!canInvokeDocumentAction()) {
          return;
        }

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
        */ // TODO(web)
      },
      [api, canInvokeDocumentAction],
    );

    // Define columns inside component to pass callbacks to getActions
    const COLUMNS = useMemo(
      () => [
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
          accessor: row => (
            <ActionDropdown row={row} onDownload={onDownload} onClickDelete={onClickDelete} />
          ),
          dontCallRowInput: true,
          sortable: false,
        },
      ],
      [onDownload, onClickDelete],
    );

    return (
      <>
        <DataFetchingTable
          endpoint={endpoint}
          columns={COLUMNS}
          noDataMessage="No documents found"
          fetchOptions={searchParameters}
          refreshCount={refreshCount}
          allowExport={false}
          elevated={elevated}
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
  },
);
