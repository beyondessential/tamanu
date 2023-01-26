import React, { useCallback, useState, useMemo } from 'react';
import { extension } from 'mime-types';
import { promises as asyncFs } from 'fs';

import GetAppIcon from '@material-ui/icons/GetApp';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DeleteButton, Button } from './Button';
import { ButtonRow } from './ButtonRow';
import { ConfirmModal } from './ConfirmModal';
import { useElectron } from '../contexts/Electron';
import { useApi } from '../api';
import { notify, notifySuccess, notifyError } from '../utils';
import { DocumentPreviewModal } from './DocumentPreview';

const DOCUMENT_ACTIONS = {
  DELETE: 'delete',
  VIEW: 'view',
};

// eslint-disable-next-line no-unused-vars
const ActionButtons = React.memo(({ row, onDownload, onClickDelete, onClickView }) => {
  // { row, onDownload, onClickDelete }
  const actions = [
    {
      key: 'view',
      label: 'View',
      onClick: () => onClickView(row),
    },
    {
      key: 'download',
      icon: <GetAppIcon />,
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

  return actions.map(action => (
    <Button
      variant="outlined"
      size="small"
      startIcon={action.icon}
      onClick={action.onClick}
      key={action.key}
    >
      {action.label}
    </Button>
  ));
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
    const { showSaveDialog, openPath } = useElectron();
    const api = useApi();

    // Confirm delete modal will be open/close if it has a document ID
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentAction, setDocumentAction] = useState(null);
    const onClose = useCallback(() => {
      setSelectedDocument(null);
      setDocumentAction(null);
    }, []);

    // Deletes selected document on confirmation (TBD)
    const onConfirmDelete = useCallback(() => {
      // Only perform deletion if there is internet connection
      if (canInvokeDocumentAction()) {
        console.log('Delete document TBD', selectedDocument); // eslint-disable-line no-console
      }

      // Close modal either way
      onClose();
    }, [selectedDocument, onClose, canInvokeDocumentAction]);

    // Callbacks invoked inside getActions
    const onClickDelete = useCallback(row => {
      setSelectedDocument(row);
      setDocumentAction(DOCUMENT_ACTIONS.DELETE);
    }, []);
    const onClickView = useCallback(row => {
      setSelectedDocument(row);
      setDocumentAction(DOCUMENT_ACTIONS.VIEW);
    }, []);
    const onDownload = useCallback(
      async row => {
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
      },
      [api, openPath, showSaveDialog, canInvokeDocumentAction],
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
            <ActionButtons
              row={row}
              onDownload={onDownload}
              onClickDelete={onClickDelete}
              onClickView={onClickView}
            />
          ),
          dontCallRowInput: true,
          sortable: false,
        },
      ],
      [onDownload, onClickDelete, onClickView],
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
          open={selectedDocument !== null && documentAction === DOCUMENT_ACTIONS.DELETE}
          title="Delete document"
          text="WARNING: This action is irreversible!"
          subText="Are you sure you want to delete this document?"
          onConfirm={onConfirmDelete}
          onCancel={onClose}
          ConfirmButton={DeleteButton}
        />
        <DocumentPreviewModal
          open={selectedDocument !== null && documentAction === DOCUMENT_ACTIONS.VIEW}
          title={selectedDocument?.name}
          attachmentId={selectedDocument?.attachmentId}
          documentType={getType({ type: selectedDocument?.type })}
          onClose={onClose}
          onDownload={() => onDownload(selectedDocument)}
        />
      </>
    );
  },
);
