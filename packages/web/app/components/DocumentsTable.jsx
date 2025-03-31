import React, { useState } from 'react';
import styled from 'styled-components';
import { extension } from 'mime-types';

import GetAppIcon from '@material-ui/icons/GetApp';
import { IconButton } from '@material-ui/core';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { LimitedLinesCell } from './FormattedTableCell';
import { TranslatedText, TranslatedReferenceData } from './Translation';

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

const getAttachmentType = ({ type }) => {
  // Note that this may not be the actual extension of the file uploaded.
  // Instead, its the default extension for the mime-type of the file uploaded.
  // i.e. a file which originally had '.jpg' extension may be listed as a JPEG
  const fileExtension = extension(type);
  if (typeof fileExtension === 'string') return fileExtension.toUpperCase();
  return 'Unknown';
};

const getUploadedDate = ({ documentUploadedAt }) =>
  documentUploadedAt ? <DateDisplay date={documentUploadedAt} data-test-id='datedisplay-e62m' /> : '';
const getDepartmentName = ({ department }) => department
  ? <TranslatedReferenceData
  fallback={department.name}
  value={department.id}
  category="department"
  data-test-id='translatedreferencedata-u9f7' />
  : ''

export const DocumentsTable = React.memo(
  ({
    endpoint,
    searchParameters,
    refreshCount,
    refreshTable,
    onDownload,
    openDocumentPreview
  }) => {
    const { ability } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const actions = [
      {
        label: <TranslatedText
          stringId="general.action.delete"
          fallback="Delete"
          data-test-id='translatedtext-x6im' />,
        action: () => setModalOpen(true),
        permissionCheck: () => {
          return ability?.can('delete', 'DocumentMetadata');
        },
      },
    ].filter(({ permissionCheck }) => {
      return permissionCheck ? permissionCheck() : true;
    });

    // Define columns inside component to pass callbacks to getActions
    const COLUMNS = [
      {
        key: 'name',
        title: <TranslatedText
          stringId="general.table.column.name"
          fallback="Name"
          data-test-id='translatedtext-m0xc' />,
        CellComponent: LimitedLinesCell,
      },
      {
        key: 'type',
        title: <TranslatedText
          stringId="document.table.column.type"
          fallback="Type"
          data-test-id='translatedtext-dior' />,
        accessor: getAttachmentType,
      },
      {
        key: 'documentUploadedAt',
        title: <TranslatedText
          stringId="document.table.column.uploadedDate"
          fallback="Upload"
          data-test-id='translatedtext-qrps' />,
        accessor: getUploadedDate,
      },
      {
        key: 'documentOwner',
        title: <TranslatedText
          stringId="document.table.column.owner"
          fallback="Owner"
          data-test-id='translatedtext-cg53' />,
        CellComponent: LimitedLinesCell,
      },
      {
        key: 'department.name',
        title: <TranslatedText
          stringId="general.department.label"
          fallback="Department"
          data-test-id='translatedtext-t55n' />,
        accessor: getDepartmentName,
        CellComponent: LimitedLinesCell,
        sortable: false,
      },
      {
        key: 'note',
        title: <TranslatedText
          stringId="document.table.column.comments"
          fallback="Comments"
          data-test-id='translatedtext-3die' />,
        sortable: false,
        CellComponent: LimitedLinesCell,
      },
      {
        key: 'actions',
        title: <TranslatedText
          stringId="document.table.column.actions"
          fallback="Actions"
          data-test-id='translatedtext-jbuu' />,
        dontCallRowInput: true,
        sortable: false,
        CellComponent: ({ data }) => (
          <ActionWrapper onMouseEnter={() => setSelectedDocument(data)}>
            <StyledIconButton color="primary" onClick={() => onDownload(data)} key="download">
              <GetAppIcon fontSize="small" />
            </StyledIconButton>
            {actions.length > 0 && <MenuButton actions={actions} data-test-id='menubutton-zrlx' />}
          </ActionWrapper>
        ),
      },
    ];

    return (
      <>
        <DataFetchingTable
          endpoint={endpoint}
          columns={COLUMNS}
          noDataMessage={
            <TranslatedText
              stringId="documents.table.noData"
              fallback="No documents found"
              data-test-id='translatedtext-dcv4' />
          }
          fetchOptions={searchParameters}
          refreshCount={refreshCount}
          allowExport={false}
          elevated={false}
          onRowClick={row => openDocumentPreview(row)}
          rowIdKey="id"
          data-test-id='datafetchingtable-1kc7' />
        <DeleteDocumentModal
          open={modalOpen}
          documentToDelete={selectedDocument}
          endpoint={endpoint}
          onClose={() => {
            setModalOpen(false);
            refreshTable();
          }}
        />
      </>
    );
  },
);
