import React, { useCallback, useState, useMemo } from 'react';
import styled from 'styled-components';
import { extension } from 'mime-types';
import { promises as asyncFs } from 'fs';

import GetAppIcon from '@material-ui/icons/GetApp';
import { IconButton } from '@material-ui/core';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { DeleteButton, Button } from './Button';
import { ConfirmModal } from './ConfirmModal';
import { useElectron } from '../contexts/Electron';
import { useApi } from '../api';
import { notify, notifySuccess, notifyError } from '../utils';
import { DocumentPreviewModal } from './DocumentPreview';

const ActionsContainer = styled.div`
  display: flex;
`;

const Action = styled(Button)`
  margin-right: 0.5rem;
  height: auto;
`;

const StyledIconButton = styled(IconButton)`
  border: 1px solid;
  border-color: ${props => props.theme.palette.primary.main};
  color: ${props => props.theme.palette.primary.main};
  border-radius: 3px;
  padding-left: 10px;
  padding-right: 10px;
`;

const ActionButtons = React.memo(({ row, onDownload, onClickView }) => (
  <ActionsContainer>
    <Action variant="outlined" size="small" onClick={() => onClickView(row)} key="view">
      View
    </Action>
    <StyledIconButton color="primary" onClick={() => onDownload(row)} key="download">
      <GetAppIcon fontSize="small" />
    </StyledIconButton>
  </ActionsContainer>
));

const getType = ({ type }) => type ?? 'Unknown';
const getUploadedDate = ({ documentUploadedAt }) =>
  documentUploadedAt ? <DateDisplay date={documentUploadedAt} /> : '';
const getDepartmentName = ({ department }) => department?.name || '';

export const DocumentsTable = React.memo(
  ({ endpoint, searchParameters, refreshCount, selectedDocument, setSelectedDocument }) => {
    const { showSaveDialog, openPath } = useElectron();
    // TODO: Show error message
    const [errorMessage, setErrorMessage] = useState();
    const api = useApi();

    // Confirm delete modal will be open/close if it has a document ID
    const onClose = useCallback(() => {
      setSelectedDocument(null);
    }, [setSelectedDocument]);

    const onDownload = useCallback(
      async row => {
        if (!navigator.onLine) {
          setErrorMessage(
            'You do not currently have an internet connection. Documents require live internet to download.',
          );
          return;
        }

        // Suggest a filename that matches the document name
        const path = await showSaveDialog({ defaultPath: row.name });
        if (path.canceled) return;

        try {
          // Give feedback to user that download is starting
          notify('Your download has started, please wait.', { type: 'info' });

          // Download attachment (*currently the API only supports base64 responses)
          const { data, type } = await api.get(`attachment/${row.attachmentId}`, { base64: true });

          // If the extension is unknown, save it without extension
          const fileExtension = extension(type);
          const fullFilePath = fileExtension ? `${path.filePath}.${fileExtension}` : path.filePath;

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
            <ActionButtons row={row} onDownload={onDownload} onClickView={setSelectedDocument} />
          ),
          dontCallRowInput: true,
          sortable: false,
        },
      ],
      [onDownload, setSelectedDocument],
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
          elevated={false}
        />
        {/* <ConfirmModal
          open={selectedDocument !== null && documentAction === DOCUMENT_ACTIONS.DELETE}
          title="Delete document"
          text="WARNING: This action is irreversible!"
          subText="Are you sure you want to delete this document?"
          onConfirm={onConfirmDelete}
          onCancel={onClose}
          ConfirmButton={DeleteButton}
        /> */}
        <DocumentPreviewModal
          open={selectedDocument !== null}
          title={selectedDocument?.name}
          attachmentId={selectedDocument?.attachmentId}
          documentType={selectedDocument?.type}
          onClose={onClose}
          onDownload={() => onDownload(selectedDocument)}
        />
      </>
    );
  },
);
