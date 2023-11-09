import React, { useState } from 'react';
import styled from 'styled-components';
import { extension } from 'mime-types';

import GetAppIcon from '@material-ui/icons/GetApp';
import { IconButton } from '@material-ui/core';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

import { DeleteDocumentModal } from '../views/patients/components/DeleteDocumentModal';
import { MenuButton } from './MenuButton';

const ActionWrapper = styled.div`
  width: 0; // This is needed to move content to the right side of the table
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledIconButton = styled(IconButton)`
  border: 1px solid;
  border-color: transparent;
  color: ${props => props.theme.palette.primary.main};
  border-radius: 3px;
  padding-left: 10px;
  padding-right: 10px;
`;

const MODAL_IDS = {
  DELETE: 'delete',
};

const MODALS = {
  [MODAL_IDS.DELETE]: DeleteDocumentModal,
};

const getAttachmentType = ({ type }) => {
  // Note that this may not be the actual extension of the file uploaded.
  // Instead, its the default extension for the mime-type of the file uploaded.
  // i.e. a file which originally had '.jpg' extension may be listed as a JPEG
  const fileExtension = extension(type);
  if (typeof fileExtension === 'string') return fileExtension.toUpperCase();
  return 'Unknown';
};

const getUploadedDate = ({ documentUploadedAt }) =>
  documentUploadedAt ? <DateDisplay date={documentUploadedAt} /> : '';
const getDepartmentName = ({ department }) => department?.name || '';

export const DocumentsTable = React.memo(
  ({ endpoint, searchParameters, refreshCount, onDownload, openDocumentPreview }) => {
    const [modalId, setModalId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const handleChangeModalId = id => {
      setModalId(id);
      setModalOpen(true);
    };

    const menuActions = {
      Delete: () => {
        handleChangeModalId(MODAL_IDS.DELETE);
      },
    };

    const ActiveModal = MODALS[modalId] || null;

    // Define columns inside component to pass callbacks to getActions
    const COLUMNS = [
      { key: 'name', title: 'Name' },
      { key: 'type', title: 'Type', accessor: getAttachmentType },
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
        dontCallRowInput: true,
        sortable: false,
        CellComponent: ({ data }) => {
          return (
            <ActionWrapper onMouseEnter={() => setSelectedDocument(data)}>
              <StyledIconButton color="primary" onClick={() => onDownload(data)} key="download">
                <GetAppIcon fontSize="small" />
              </StyledIconButton>
              <MenuButton actions={menuActions} />
            </ActionWrapper>
          );
        },
      },
    ];

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
          onRowClick={row => openDocumentPreview(row)}
        />
        {ActiveModal && (
          <ActiveModal
            open={modalOpen}
            documentToDelete={selectedDocument}
            onClose={() => {
              setModalOpen(false);
              // queryClient.invalidateQueries(['patientCurrentEncounter', patient.id]);
              // setRefreshCount(refreshCount + 1);
            }}
          />
        )}
      </>
    );
  },
);
