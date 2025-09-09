import React, { useState } from 'react';
import styled from 'styled-components';
import { extension } from 'mime-types';

import GetAppIcon from '@mui/icons-material/GetApp';
import { IconButton } from '@mui/material';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { LimitedLinesCell } from './FormattedTableCell';
import { TranslatedText, TranslatedReferenceData } from './Translation';
import { DeleteDocumentModal } from '../views/patients/components/DeleteDocumentModal';
import { MenuButton } from './MenuButton';
import { useAuth } from '../contexts/Auth';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

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
  documentUploadedAt ? (
    <DateDisplay date={documentUploadedAt} data-testid="datedisplay-gwjf" />
  ) : (
    ''
  );
const getDepartmentName = ({ department }) =>
  department ? (
    <TranslatedReferenceData
      fallback={department.name}
      value={department.id}
      category="department"
      data-testid="translatedreferencedata-vi1d"
    />
  ) : (
    ''
  );

export const DocumentsTable = React.memo(
  ({ endpoint, searchParameters, refreshCount, refreshTable, onDownload, openDocumentPreview }) => {
    const { ability } = useAuth();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);

    const actions = [
      {
        label: (
          <TranslatedText
            stringId="general.action.delete"
            fallback="Delete"
            data-testid="translatedtext-cgro"
          />
        ),
        action: () => setModalOpen(true),
        permissionCheck: () => {
          return ability?.can('delete', 'DocumentMetadata');
        },
        wrapper: menuItem => {
          return <NoteModalActionBlocker>{menuItem}</NoteModalActionBlocker>;
        },
      },
    ].filter(({ permissionCheck }) => {
      return permissionCheck ? permissionCheck() : true;
    });

    // Define columns inside component to pass callbacks to getActions
    const COLUMNS = [
      {
        key: 'name',
        title: (
          <TranslatedText
            stringId="general.table.column.name"
            fallback="Name"
            data-testid="translatedtext-57ad"
          />
        ),
        CellComponent: LimitedLinesCell,
      },
      {
        key: 'type',
        title: (
          <TranslatedText
            stringId="document.table.column.type"
            fallback="Type"
            data-testid="translatedtext-tl4g"
          />
        ),
        accessor: getAttachmentType,
      },
      {
        key: 'documentUploadedAt',
        title: (
          <TranslatedText
            stringId="document.table.column.uploadedDate"
            fallback="Upload"
            data-testid="translatedtext-pwph"
          />
        ),
        accessor: getUploadedDate,
      },
      {
        key: 'documentOwner',
        title: (
          <TranslatedText
            stringId="document.table.column.owner"
            fallback="Owner"
            data-testid="translatedtext-5luo"
          />
        ),
        CellComponent: LimitedLinesCell,
      },
      {
        key: 'department.name',
        title: (
          <TranslatedText
            stringId="general.department.label"
            fallback="Department"
            data-testid="translatedtext-l1p0"
          />
        ),
        accessor: getDepartmentName,
        CellComponent: LimitedLinesCell,
        sortable: false,
      },
      {
        key: 'note',
        title: (
          <TranslatedText
            stringId="document.table.column.comments"
            fallback="Comments"
            data-testid="translatedtext-87f5"
          />
        ),
        sortable: false,
        CellComponent: LimitedLinesCell,
      },
      {
        key: 'actions',
        title: (
          <TranslatedText
            stringId="document.table.column.actions"
            fallback="Actions"
            data-testid="translatedtext-dpbk"
          />
        ),
        dontCallRowInput: true,
        sortable: false,
        CellComponent: ({ data }) => (
          <ActionWrapper
            onMouseEnter={() => setSelectedDocument(data)}
            data-testid="actionwrapper-lisn"
          >
            <StyledIconButton
              color="primary"
              onClick={() => onDownload(data)}
              key="download"
              data-testid="stylediconbutton-o907"
            >
              <GetAppIcon fontSize="small" data-testid="getappicon-dpgk" />
            </StyledIconButton>
            {actions.length > 0 && <MenuButton actions={actions} data-testid="menubutton-5s3g" />}
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
              data-testid="translatedtext-15z7"
            />
          }
          fetchOptions={searchParameters}
          refreshCount={refreshCount}
          allowExport={false}
          elevated={false}
          onRowClick={row => openDocumentPreview(row)}
          rowIdKey="id"
          data-testid="datafetchingtable-s6m9"
        />
        <DeleteDocumentModal
          open={modalOpen}
          documentToDelete={selectedDocument}
          endpoint={endpoint}
          onClose={() => {
            setModalOpen(false);
            refreshTable();
          }}
          data-testid="deletedocumentmodal-nu94"
        />
      </>
    );
  },
);
