import React, { useMemo } from 'react';
import styled from 'styled-components';
import { extension } from 'mime-types';

import GetAppIcon from '@material-ui/icons/GetApp';
import { IconButton } from '@material-ui/core';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { Button } from './Button';
import { LimitedLinesCell } from './FormattedTableCell';
import { TranslatedText } from './Translation/TranslatedText';

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
      <TranslatedText stringId="general.action.view" fallback="View" />
    </Action>
    <StyledIconButton color="primary" onClick={() => onDownload(row)} key="download">
      <GetAppIcon fontSize="small" />
    </StyledIconButton>
  </ActionsContainer>
));

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
    // Define columns inside component to pass callbacks to getActions
    const COLUMNS = useMemo(
      () => [
        {
          key: 'name',
          title: <TranslatedText stringId="general.table.column.name" fallback="Name" />,
          CellComponent: LimitedLinesCell,
        },
        {
          key: 'type',
          title: <TranslatedText stringId="document.table.column.type" fallback="Type" />,
          accessor: getAttachmentType,
        },
        {
          key: 'documentUploadedAt',
          title: <TranslatedText stringId="document.table.column.uploadedDate" fallback="Upload" />,
          accessor: getUploadedDate,
        },
        {
          key: 'documentOwner',
          title: <TranslatedText stringId="document.table.column.owner" fallback="Owner" />,
          CellComponent: LimitedLinesCell,
        },
        {
          key: 'department.name',
          title: (
            <TranslatedText stringId="document.table.column.department" fallback="Department" />
          ),
          accessor: getDepartmentName,
          CellComponent: LimitedLinesCell,
          sortable: false,
        },
        {
          key: 'note',
          title: <TranslatedText stringId="document.table.column.comments" fallback="Comments" />,
          sortable: false,
          CellComponent: LimitedLinesCell,
        },
        {
          key: 'actions',
          title: <TranslatedText stringId="document.table.column.actions" fallback="Actions" />,
          accessor: row => (
            <ActionButtons row={row} onDownload={onDownload} onClickView={openDocumentPreview} />
          ),
          dontCallRowInput: true,
          sortable: false,
        },
      ],
      [onDownload, openDocumentPreview],
    );

    return (
      <DataFetchingTable
        endpoint={endpoint}
        columns={COLUMNS}
        noDataMessage={
          <TranslatedText stringId="documents.table.noData" fallback="No documents found" />
        }
        fetchOptions={searchParameters}
        refreshCount={refreshCount}
        allowExport={false}
        elevated={false}
      />
    );
  },
);
