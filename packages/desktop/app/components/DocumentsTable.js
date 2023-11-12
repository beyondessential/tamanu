import React, { useMemo } from 'react';
import styled from 'styled-components';
import { extension } from 'mime-types';

import GetAppIcon from '@material-ui/icons/GetApp';
import { IconButton, TableRow } from '@material-ui/core';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { Button } from './Button';
import { ThemedTooltip } from './Tooltip';

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

const TwoLineTextWrapper = styled.div`
  max-height: 35px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  white-space: pre-wrap;
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

const TextDisplay = React.memo(({ text: textContent }) => {
  // const displayText = textContent;
  return (
    <ThemedTooltip title={textContent}>
      <TwoLineTextWrapper>{textContent}</TwoLineTextWrapper>
    </ThemedTooltip>
  );
});

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

const getNote = ({ note }) => (note ? <TextDisplay text={note} /> : '');

const getName = ({ name }) => <TextDisplay text={name} />;

export const DocumentsTable = React.memo(
  ({ endpoint, searchParameters, refreshCount, onDownload, openDocumentPreview }) => {
    // Define columns inside component to pass callbacks to getActions
    const COLUMNS = useMemo(
      () => [
        { key: 'name', title: 'Name', accessor: getName },
        { key: 'type', title: 'Type', accessor: getAttachmentType },
        { key: 'documentUploadedAt', title: 'Upload', accessor: getUploadedDate },
        { key: 'documentOwner', title: 'Owner' },
        {
          key: 'department.name',
          title: 'Department',
          accessor: getDepartmentName,
          sortable: false,
        },
        {
          key: 'note',
          title: 'Comments',
          sortable: false,
          accessor: getNote,
        },
        {
          key: 'actions',
          title: 'Actions',
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
        noDataMessage="No documents found"
        fetchOptions={searchParameters}
        refreshCount={refreshCount}
        allowExport={false}
        elevated={false}
      />
    );
  },
);
