import React, { useCallback, useMemo, useState, useRef } from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';

import { NOTE_TYPES } from '@tamanu/shared/constants';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { Colors, NOTE_TYPE_LABELS } from '../constants';
import { useAuth } from '../contexts/Auth';
import { NOTE_FORM_MODES, NoteModal } from './NoteModal';
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
  width: 100%;
  position: relative;
  overflow: hidden;
  display: -webkit-box;
  white-space: pre-line;
  ${props =>
    !props.$expanded
      ? `
    text-overflow: clip;
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
  ${props => (props.$bottom > 0 ? `right: 0` : '')};
`;

const ShowLessSpan = styled(EllipsisHideShowSpan)``;

const NoteHeaderContainer = styled.div`
  margin-bottom: 5px;
`;

const NoteHeaderText = styled.span`
  font-weight: 500;
  color: ${Colors.midText};
`;

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

const NoDataMessage = styled.span`
  font-weight: 500;
  color: ${Colors.primary};
`;

const NoteContent = ({
  note,
  hasPermission,
  currentUser,
  handleEditNote,
  handleViewNoteChangeLog,
  isNotFilteredByNoteType,
}) => {
  const noteContentContainerRef = useRef();
  const contentLineClipping = useRef();
  const [contentIsClipped, setContentIsClipped] = useState(false);
  const [contentIsExpanded, setContentIsExpanded] = useState(false);
  const handleReadMore = useCallback(() => setContentIsExpanded(true), []);
  const handleReadLess = useCallback(() => setContentIsExpanded(false), []);
  return (
    <NoteRowContainer>
      {isNotFilteredByNoteType && (
        <NoteHeaderContainer>
          <NoteHeaderText>{NOTE_TYPE_LABELS[note.noteType]}</NoteHeaderText>
        </NoteHeaderContainer>
      )}
      <NoteBodyContainer>
        <NoteContentContainer
          $expanded={contentIsExpanded}
          ref={el => {
            noteContentContainerRef.current = el;
            setContentIsClipped(el?.offsetHeight < el?.scrollHeight);
          }}
        >
          {note?.content?.split('\n').map((line, i, { length }) => {
            const elementRef = contentLineClipping?.current?.[i];
            const contentOffsetHeight = noteContentContainerRef.current?.offsetHeight;
            const isVisible = contentOffsetHeight > elementRef?.offsetTop;
            const hiddenHeight =
              elementRef?.offsetTop + elementRef?.offsetHeight - contentOffsetHeight;
            return (
              <>
                <span
                  ref={el => {
                    const tempLineClipping = [...(contentLineClipping?.current || [])];
                    tempLineClipping[i] = el;
                    contentLineClipping.current = tempLineClipping;
                  }}
                >
                  {line}
                  {contentIsClipped && !contentIsExpanded && isVisible && hiddenHeight >= -1 && (
                    <ReadMoreSpan $bottom={hiddenHeight} onClick={handleReadMore}>
                      ...read more
                    </ReadMoreSpan>
                  )}
                  {'\n'}
                </span>
                {contentIsExpanded && i === length - 1 && (
                  <ShowLessSpan onClick={handleReadLess}> Show less</ShowLessSpan>
                )}
              </>
            );
          })}
        </NoteContentContainer>
        {(hasPermission || currentUser.id === note.authorId) &&
          note.noteType !== NOTE_TYPES.SYSTEM && (
            <StyledEditIcon onClick={() => handleEditNote(note)} />
          )}
      </NoteBodyContainer>
      <NoteFooterContainer>
        {note.noteType === NOTE_TYPES.TREATMENT_PLAN ? (
          <NoteFooterTextElement>Last updated:</NoteFooterTextElement>
        ) : (
          <NoteFooterTextElement>Created:</NoteFooterTextElement>
        )}
        {note.author?.displayName ? (
          <NoteFooterTextElement>{note.author.displayName}</NoteFooterTextElement>
        ) : null}
        {note.onBehalfOf?.displayName ? (
          <NoteFooterTextElement>on behalf of {note.onBehalfOf.displayName}</NoteFooterTextElement>
        ) : null}
        <DateDisplay
          date={(note.noteType !== NOTE_TYPES.TREATMENT_PLAN && note.revisedBy?.date) || note.date}
          showTime
        />
        {note.revisedById && (
          <EditedButtonContainer onClick={() => handleViewNoteChangeLog(note)}>
            <span>(</span>
            <EditedButton>edited</EditedButton>
            <span>)</span>
          </EditedButtonContainer>
        )}
      </NoteFooterContainer>
    </NoteRowContainer>
  );
};

const NoteTable = ({ encounterId, hasPermission, noteModalOnSaved, noteType }) => {
  const { currentUser } = useAuth();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalNoteFormMode, setModalNoteFormMode] = useState(NOTE_FORM_MODES.EDIT_NOTE);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCancelText, setModalCancelText] = useState('');
  const [modalNote, setModalNote] = useState(null);

  const handleEditNote = useCallback(
    note => {
      setModalTitle('Edit note');
      setModalCancelText('Cancel');
      setModalNoteFormMode(NOTE_FORM_MODES.EDIT_NOTE);
      setIsNoteModalOpen(true);
      setModalNote(note);
    },
    [setModalTitle, setModalCancelText, setIsNoteModalOpen, setModalNote, setModalNoteFormMode],
  );

  const handleViewNoteChangeLog = useCallback(
    note => {
      setModalTitle('Change log');
      setModalNoteFormMode(NOTE_FORM_MODES.VIEW_NOTE);
      setIsNoteModalOpen(true);
      setModalNote(note);
    },
    [setModalTitle, setIsNoteModalOpen, setModalNote, setModalNoteFormMode],
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
            handleViewNoteChangeLog={handleViewNoteChangeLog}
            isNotFilteredByNoteType={!noteType}
          />
        ),
        sortable: false,
      },
    ],
    [hasPermission, currentUser, noteType, handleEditNote, handleViewNoteChangeLog],
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
          noteFormMode={modalNoteFormMode}
          confirmText={modalNoteFormMode === NOTE_FORM_MODES.VIEW_NOTE ? 'Close' : 'Save'}
        />
      )}
      <DataFetchingTable
        lazyLoading
        hideHeader
        allowExport={false}
        columns={COLUMNS}
        endpoint={`encounter/${encounterId}/notes`}
        fetchOptions={{ noteType }}
        elevated={false}
        noDataBackgroundColor={Colors.background}
        noDataMessage={
          <NoDataMessage>
            {`This patient has no notes ${
              noteType ? 'of this type ' : ''
            }to display. Click ‘New note’ to add a note.`}
          </NoDataMessage>
        }
      />
    </>
  );
};

export const NoteTableWithPermission = withPermissionCheck(NoteTable);
