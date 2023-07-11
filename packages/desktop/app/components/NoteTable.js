import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';

import { NOTE_TYPES } from '@tamanu/shared/constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { Colors } from '../constants';
import { useAuth } from '../contexts/Auth';
import { NoteModal } from './NoteModal';
import { withPermissionCheck } from './withPermissionCheck';

const StyledEditIcon = styled(EditIcon)`
  cursor: pointer;
  float: right;
  width: 1rem;
  height: 1rem;
  color: ${Colors.primary};
`;

const NoteRowContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const NoteContentContainer = styled.div`
  position: relative;
  overflow: hidden;
  display: -webkit-box;
  ${props =>
    !props.$expanded
      ? `
    text-overflow: ellipsis;
    -webkit-line-clamp: 4;
            line-clamp: 4;
    -webkit-box-orient: vertical;
  `
      : ''}
`;

const EllipsisHideShowSpan = styled.span`
  background-color: ${Colors.white};
  color: ${Colors.primary};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const ReadMoreSpan = styled(EllipsisHideShowSpan)`
  position: absolute;
  bottom: 0;
  right: 0;
`;

const ShowLessSpan = styled(EllipsisHideShowSpan)``;

const NoteBodyContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const NoteFooterContainer = styled.div`
  display: flex;
  align-self: flex-end;
  margin-top: 10px;
  font-size: 11px;
  font-weight: 500;
  color: ${Colors.softText};
`;

const EditedButton = styled.span`
  cursor: pointer;
  text-decoration: underline;
  &:hover {
    color: ${Colors.primary};
  }
`;

const EditedButtonContainer = styled.div`
  margin-left: 3px;
`;

const NoteFooterTextElement = styled.span`
  margin-right: 3px;
`;

const NoteContent = ({ note, hasPermission, currentUser, handleEditNote }) => {
  const [contentIsClipped, setContentIsClipped] = useState(false);
  const [textIsExpanded, setTextIsExpanded] = useState(false);
  const handleReadMore = useCallback(() => setTextIsExpanded(true), []);
  const handleReadLess = useCallback(() => setTextIsExpanded(false), []);
  return (
    <NoteRowContainer>
      <NoteBodyContainer>
        <NoteContentContainer
          $expanded={textIsExpanded}
          ref={el => setContentIsClipped(el?.offsetHeight < el?.scrollHeight)}
        >
          <span>{note?.content || ''}</span>
          {contentIsClipped && !textIsExpanded && (
            <ReadMoreSpan onClick={handleReadMore}>...read more</ReadMoreSpan>
          )}
          {textIsExpanded && <ShowLessSpan onClick={handleReadLess}> Show less</ShowLessSpan>}
        </NoteContentContainer>
        {(hasPermission || currentUser.id === note.authorId) &&
          note.noteType !== NOTE_TYPES.SYSTEM && (
            <StyledEditIcon onClick={() => handleEditNote(note)} />
          )}
      </NoteBodyContainer>
      <NoteFooterContainer>
        {note.author?.displayName ? (
          <NoteFooterTextElement>{note.author.displayName}</NoteFooterTextElement>
        ) : null}
        {note.onBehalfOf?.displayName ? (
          <NoteFooterTextElement>on behalf of {note.onBehalfOf.displayName}</NoteFooterTextElement>
        ) : null}
        <DateDisplay date={note?.date} showTime />
        {note.revisedById && (
          <EditedButtonContainer>
            <span>(</span>
            <EditedButton>edited</EditedButton>
            <span>)</span>
          </EditedButtonContainer>
        )}
      </NoteFooterContainer>
    </NoteRowContainer>
  );
};

const NoteTable = ({ encounterId, hasPermission, noteModalOnSaved }) => {
  const { currentUser } = useAuth();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCancelText, setModalCancelText] = useState('');
  const [modalNote, setModalNote] = useState(null);

  const handleEditNote = useCallback(
    note => {
      setModalTitle('Edit note');
      setModalCancelText('Cancel');
      setIsNoteModalOpen(true);
      setModalNote(note);
    },
    [setModalTitle, setModalCancelText, setIsNoteModalOpen, setModalNote],
  );

  const COLUMNS = useMemo(
    () => [
      {
        key: 'content',
        title: 'Content',
        accessor: note => (
          <NoteContent
            note={note}
            hasPermission={hasPermission}
            currentUser={currentUser}
            handleEditNote={handleEditNote}
          />
        ),
        sortable: false,
      },
    ],
    [hasPermission, currentUser, handleEditNote],
  );

  return (
    <>
      {hasPermission && (
        <NoteModal
          open={isNoteModalOpen}
          encounterId={encounterId}
          onClose={() => setIsNoteModalOpen(false)}
          onSaved={noteModalOnSaved}
          note={modalNote}
          title={modalTitle}
          cancelText={modalCancelText}
          confirmText="Save"
        />
      )}

      <DataFetchingTable
        lazyLoading
        hideHeader
        allowExport={false}
        columns={COLUMNS}
        endpoint={`encounter/${encounterId}/notes`}
        // onRowClick={handleRowClick}
        // customSort={sortNotes}
        elevated={false}
      />
    </>
  );
};

export const NoteTableWithPermission = withPermissionCheck(NoteTable);
