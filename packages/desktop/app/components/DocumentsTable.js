import React, { useState } from 'react';
import styled from 'styled-components';
import { extension } from 'mime-types';

import GetAppIcon from '@material-ui/icons/GetApp';
import { IconButton } from '@material-ui/core';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { LimitedLinesCell } from './FormattedTableCell';

import { DeleteDocumentModal } from '../views/patients/components/DeleteDocumentModal';
import { MenuButton } from './MenuButton';
import { useAuth } from '../contexts/Auth';

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
  ({
    endpoint,
    searchParameters,
    refreshCount,
    setRefreshCount,
    onDownload,
    openDocumentPreview,
  }) => {
    const { ability } = useAuth();
    const [modalId, setModalId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const handleChangeModalId = id => {
      setModalId(id);
      setModalOpen(true);
    };

    const menuActions = [
      {
        label: 'Delete',
        action: () => handleChangeModalId(MODAL_IDS.DELETE),
        permissionCheck: () => {
          return ability?.can('delete', 'DocumentMetadata');
        },
      },
    ];

    const ActiveModal = MODALS[modalId] || null;

    const actions = menuActions
      .filter(({ permissionCheck }) => {
        return permissionCheck ? permissionCheck() : true;
      })
      .reduce((acc, { label, action }) => {
        acc[label] = action;
        return acc;
      }, {});

    const isAllActionsDeniedDueToPerm = Object.keys(actions).length === 0;

    // Define columns inside component to pass callbacks to getActions
    const COLUMNS = [
      { key: 'name', title: 'Name', CellComponent: LimitedLinesCell },
      { key: 'type', title: 'Type', accessor: getAttachmentType },
      { key: 'documentUploadedAt', title: 'Upload', accessor: getUploadedDate },
      { key: 'documentOwner', title: 'Owner', CellComponent: LimitedLinesCell },
      {
        key: 'department.name',
        title: 'Department',
        accessor: getDepartmentName,
        CellComponent: LimitedLinesCell,
        sortable: false,
      },
      {
        key: 'note',
        title: 'Comments',
        sortable: false,
        CellComponent: LimitedLinesCell,
      },
      {
        key: 'actions',
        title: 'Actions',
        dontCallRowInput: true,
        sortable: false,
        CellComponent: ({ data }) => {
          if (!isAllActionsDeniedDueToPerm) {
            return (
              <ActionWrapper onMouseEnter={() => setSelectedDocument(data)}>
                <StyledIconButton color="primary" onClick={() => onDownload(data)} key="download">
                  <GetAppIcon fontSize="small" />
                </StyledIconButton>
                <MenuButton actions={actions} />
              </ActionWrapper>
            );
          }
          return <></>;
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
            endpoint={endpoint}
            onClose={() => {
              setModalOpen(false);
              setRefreshCount(refreshCount + 1);
            }}
          />
        )}
      </>
    );
  },
);
