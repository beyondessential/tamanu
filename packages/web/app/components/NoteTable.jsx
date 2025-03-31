import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';

import { NOTE_PERMISSION_TYPES, NOTE_TYPES, NOTE_TYPE_LABELS } from '@tamanu/constants';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { Colors, NOTE_FORM_MODES } from '../constants';
import { useAuth } from '../contexts/Auth';
import { NoteModal } from './NoteModal';
import { withPermissionCheck } from './withPermissionCheck';
import { TranslatedEnum, TranslatedText } from './Translation';

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
    -webkit-line-clamp: 20;
            line-clamp: 20;
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
  align-self: start;
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

const NoteExpandControlContainer = styled.div`
  display: flex;
  align-self: flex-start;
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

const rowStyle = () =>
  `.MuiTableCell-root{
    border-bottom: 1px solid ${Colors.outline};

    &:first-child {
      padding-left: 0;
      padding-right: 0;
    }
  }

  padding-left: 20px;
  padding-right: 20px;`;

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
  const [contentIsClipped, setContentIsClipped] = useState(false);
  const [contentIsExpanded, setContentIsExpanded] = useState(false);
  const handleReadMore = useCallback(() => setContentIsExpanded(true), []);
  const handleReadLess = useCallback(() => setContentIsExpanded(false), []);

  const showNoteMetaPrefix = note.noteType === NOTE_TYPES.TREATMENT_PLAN && note.revisedById;
  const noteAuthorName =
    note.noteType === NOTE_TYPES.TREATMENT_PLAN || !note.revisedBy
      ? note.author?.displayName
      : note.revisedBy?.author?.displayName;
  const noteOnBehalfOfName =
    note.noteType === NOTE_TYPES.TREATMENT_PLAN || !note.revisedBy
      ? note.onBehalfOf?.displayName
      : note.revisedBy?.onBehalfOf?.displayName;

  useEffect(() => {
    const el = noteContentContainerRef.current;
    if (el) setContentIsClipped(el.offsetHeight < el.scrollHeight);
  }, [contentIsExpanded]);

  return (
    <NoteRowContainer>
      {isNotFilteredByNoteType && (
        <NoteHeaderContainer>
          <NoteHeaderText>
            <TranslatedEnum
              value={note.noteType}
              enumValues={NOTE_TYPE_LABELS}
              data-test-id='translatedenum-sxxc' />
          </NoteHeaderText>
        </NoteHeaderContainer>
      )}
      <NoteBodyContainer>
        <NoteContentContainer $expanded={contentIsExpanded} ref={noteContentContainerRef}>
          {note?.content?.split('\n').map((line, i) => {
            return (
              <span key={i}>
                {line}
                {'\n'}
              </span>
            );
          })}
        </NoteContentContainer>
        {hasIndividualNotePermission &&
          hasEncounterNoteWritePermission &&
          note.noteType !== NOTE_TYPES.SYSTEM && (
            <StyledEditIcon onClick={() => handleEditNote(note)} />
          )}
      </NoteBodyContainer>
      <NoteExpandControlContainer>
        {contentIsClipped && !contentIsExpanded && (
          <ReadMoreSpan onClick={handleReadMore}>
            ...
            <TranslatedText
              stringId="note.table.item.readMore"
              fallback="read more"
              data-test-id='translatedtext-s4ud' />
          </ReadMoreSpan>
        )}
        {contentIsExpanded && (
          <ShowLessSpan onClick={handleReadLess}>
            {' '}
            <TranslatedText
              stringId="note.table.item.showLess"
              fallback="Show less"
              data-test-id='translatedtext-tx50' />
          </ShowLessSpan>
        )}
      </NoteExpandControlContainer>
      <NoteFooterContainer>
        {showNoteMetaPrefix && (
          <NoteFooterTextElement>
            <TranslatedText
              stringId="general.lastUpdated.label"
              fallback="Last updated"
              data-test-id='translatedtext-sbf5' />:
          </NoteFooterTextElement>
        )}
        {noteAuthorName ? <NoteFooterTextElement>{noteAuthorName}</NoteFooterTextElement> : null}
        {noteOnBehalfOfName && (
          <NoteFooterTextElement>
            <TranslatedText
              stringId="note.table.onBehalfOfText"
              fallback="on behalf of :changeOnBehalfOfName"
              replacements={{ noteOnBehalfOfName }}
              data-test-id='translatedtext-rjl3' />
          </NoteFooterTextElement>
        )}
        <DateDisplay
          date={(note.noteType !== NOTE_TYPES.TREATMENT_PLAN && note.revisedBy?.date) || note.date}
          showTime
          data-test-id='datedisplay-2zlk' />
        {note.revisedById && (
          <EditedButtonContainer onClick={() => handleViewNoteChangeLog(note)}>
            <span>(</span>
            <EditedButton>
              <TranslatedText
                stringId="note.table.footer.edited"
                fallback="edited"
                data-test-id='translatedtext-e1p1' />
            </EditedButton>
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
        note.noteType === NOTE_TYPES.TREATMENT_PLAN ? (
          <TranslatedText
            stringId="note.modal.updateTreatmentPlan.title"
            fallback="Update treatment plan"
            data-test-id='translatedtext-2521' />
        ) : (
          <TranslatedText
            stringId="note.modal.edit.title"
            fallback="Edit note"
            data-test-id='translatedtext-alee' />
        ),
      );
      setModalCancelText(<TranslatedText
        stringId="general.action.cancel"
        fallback="Cancel"
        data-test-id='translatedtext-z6ye' />);
      setModalNoteFormMode(NOTE_FORM_MODES.EDIT_NOTE);
      setIsNoteModalOpen(true);
      setModalNote(note);
    },
    [setModalTitle, setModalCancelText, setIsNoteModalOpen, setModalNote, setModalNoteFormMode],
  );

  const handleViewNoteChangeLog = useCallback(
    note => {
      setModalTitle(<TranslatedText
        stringId="note.modal.changeLog.title"
        fallback="Change Log"
        data-test-id='translatedtext-hc1a' />);
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
          confirmText={
            modalNoteFormMode === NOTE_FORM_MODES.VIEW_NOTE ? (
              <TranslatedText
                stringId="general.action.close"
                fallback="Close"
                data-test-id='translatedtext-eds8' />
            ) : (
              <TranslatedText
                stringId="general.action.save"
                fallback="Save"
                data-test-id='translatedtext-2sdr' />
            )
          }
        />
      )}
      <DataFetchingTable
        lazyLoading
        hideHeader
        allowExport={false}
        columns={COLUMNS}
        key={noteType}
        endpoint={`encounter/${encounterId}/notes`}
        fetchOptions={{ noteType }}
        elevated={false}
        noDataBackgroundColor={Colors.background}
        noDataMessage={
          <NoDataMessage>
            {noteType ? (
              <TranslatedText
                stringId="note.table.noDataOfType"
                fallback="This patient has no notes of this type to display. Click ‘New note’ to add a note."
                data-test-id='translatedtext-gki5' />
            ) : (
              <TranslatedText
                stringId="note.table.noData"
                fallback="This patient has no notes to display. Click ‘New note’ to add a note."
                data-test-id='translatedtext-uwiq' />
            )}
          </NoDataMessage>
        }
        rowStyle={rowStyle}
        data-test-id='datafetchingtable-ij5f' />
    </>
  );
};

export const NoteTableWithPermission = withPermissionCheck(NoteTable);
