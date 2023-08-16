import React, { useCallback, useMemo, useState, useRef } from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';

import { NOTE_TYPES, NOTE_PERMISSION_TYPES } from '@tamanu/constants';

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

const getIndividualNotePermissionCheck = (ability, currentUser, note) => {
  // Whoever created the note should be able to edit it
  if (note.revisedBy && currentUser.id === note.revisedBy.author.id) {
    return true;
  }

  // Whoever created the note should be able to edit it (this is in case the note is the root note and has not been edited)
  if (!note.revisedBy && currentUser.id === note.authorId) {
    return true;
  }

  if (note.noteType === NOTE_TYPES.TREATMENT_PLAN) {
    return (
      ability?.can('write', NOTE_PERMISSION_TYPES.TREATMENT_PLAN_NOTE) ||
      ability?.can('write', NOTE_PERMISSION_TYPES.OTHER_PRACTITIONER_ENCOUNTER_NOTE)
    );
  }

  return ability?.can('write', NOTE_PERMISSION_TYPES.OTHER_PRACTITIONER_ENCOUNTER_NOTE);
};

const NoteContent = ({
  note,
  hasEncounterNoteWritePermission,
  handleEditNote,
  handleViewNoteChangeLog,
  isNotFilteredByNoteType,
}) => {
  const { currentUser, ability } = useAuth();
  const hasIndividualNotePermission = getIndividualNotePermissionCheck(ability, currentUser, note);
  const noteContentContainerRef = useRef();
  const contentLineClipping = useRef();
  const [contentIsClipped, setContentIsClipped] = useState(false);
  const [contentIsExpanded, setContentIsExpanded] = useState(false);
  const handleReadMore = useCallback(() => setContentIsExpanded(true), []);
  const handleReadLess = useCallback(() => setContentIsExpanded(false), []);

  const noteMetaPrefix = note.noteType === NOTE_TYPES.TREATMENT_PLAN ? 'Last updated:' : 'Created:';
  const noteAuthorName =
    note.noteType === NOTE_TYPES.TREATMENT_PLAN || !note.revisedBy
      ? note.author?.displayName
      : note.revisedBy?.author?.displayName;
  const noteOnBehalfOfName =
    note.noteType === NOTE_TYPES.TREATMENT_PLAN || !note.revisedBy
      ? note.onBehalfOf?.displayName
      : note.revisedBy?.onBehalfOf?.displayName;

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
        {hasIndividualNotePermission &&
          hasEncounterNoteWritePermission &&
          note.noteType !== NOTE_TYPES.SYSTEM && (
            <StyledEditIcon onClick={() => handleEditNote(note)} />
          )}
      </NoteBodyContainer>
      <NoteFooterContainer>
        <NoteFooterTextElement>{noteMetaPrefix}</NoteFooterTextElement>
        {noteAuthorName ? <NoteFooterTextElement>{noteAuthorName}</NoteFooterTextElement> : null}
        {noteOnBehalfOfName ? (
          <NoteFooterTextElement>on behalf of {noteOnBehalfOfName}</NoteFooterTextElement>
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

const NoteTable = ({
  encounterId,
  hasPermission: hasEncounterNoteWritePermission,
  noteModalOnSaved,
  noteType,
}) => {
  const { currentUser } = useAuth();
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [modalNoteFormMode, setModalNoteFormMode] = useState(NOTE_FORM_MODES.EDIT_NOTE);
  const [modalTitle, setModalTitle] = useState('');
  const [modalCancelText, setModalCancelText] = useState('');
  const [modalNote, setModalNote] = useState(null);

  const handleEditNote = useCallback(
    note => {
      setModalTitle(
        note.noteType === NOTE_TYPES.TREATMENT_PLAN ? 'Update treatment plan' : 'Edit note',
      );
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
            hasEncounterNoteWritePermission={hasEncounterNoteWritePermission}
            currentUser={currentUser}
            handleEditNote={handleEditNote}
            handleViewNoteChangeLog={handleViewNoteChangeLog}
            isNotFilteredByNoteType={!noteType}
          />
        ),
        sortable: false,
      },
    ],
    [
      hasEncounterNoteWritePermission,
      currentUser,
      noteType,
      handleEditNote,
      handleViewNoteChangeLog,
    ],
  );

  return (
    <>
      {hasEncounterNoteWritePermission && (
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
