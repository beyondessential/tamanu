import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';

import { NOTE_PERMISSION_TYPES, NOTE_TYPES, REFERENCE_TYPES } from '@tamanu/constants';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { Colors, NOTE_FORM_MODES } from '../constants';
import { useAuth } from '../contexts/Auth';
import { withPermissionCheck } from './withPermissionCheck';
import { TranslatedReferenceData, TranslatedText } from './Translation';
import { useNoteModal } from '../contexts/NoteModal';
import { NoteChangelogModal } from './NoteChangelogModal';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

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

  if (note.noteTypeId === NOTE_TYPES.TREATMENT_PLAN) {
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

  const isTreatmentPlan = note.noteTypeId === NOTE_TYPES.TREATMENT_PLAN;
  const showNoteMetaPrefix = isTreatmentPlan && note.revisedById;
  const noteAuthorName =
    isTreatmentPlan || !note.revisedBy
      ? note.author?.displayName
      : note.revisedBy?.author?.displayName;
  const noteOnBehalfOfName =
    isTreatmentPlan || !note.revisedBy
      ? note.onBehalfOf?.displayName
      : note.revisedBy?.onBehalfOf?.displayName;

  useEffect(() => {
    const el = noteContentContainerRef.current;
    if (el) setContentIsClipped(el.offsetHeight < el.scrollHeight);
  }, [contentIsExpanded]);

  return (
    <NoteRowContainer data-testid="noterowcontainer-h4rs">
      {isNotFilteredByNoteType && (
        <NoteHeaderContainer data-testid="noteheadercontainer-qu50">
          <NoteHeaderText data-testid="noteheadertext-e3kq">
            <TranslatedReferenceData
              fallback={note.noteTypeReference?.name || ""}
              value={note.noteTypeReference?.id}
              category={REFERENCE_TYPES.NOTE_TYPE}
              data-testid="translatedreferencedata-s324"
            />
          </NoteHeaderText>
        </NoteHeaderContainer>
      )}
      <NoteBodyContainer data-testid="notebodycontainer-2rym">
        <NoteContentContainer
          $expanded={contentIsExpanded}
          ref={noteContentContainerRef}
          data-testid="notecontentcontainer-cgxg"
        >
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
          note.noteTypeId !== NOTE_TYPES.SYSTEM && (
            <NoteModalActionBlocker>
              <StyledEditIcon
                onClick={() => handleEditNote(note)}
                data-testid="styledediticon-nmdz"
              />
            </NoteModalActionBlocker>
          )}
      </NoteBodyContainer>
      <NoteExpandControlContainer data-testid="noteexpandcontrolcontainer-nc8t">
        {contentIsClipped && !contentIsExpanded && (
          <ReadMoreSpan onClick={handleReadMore} data-testid="readmorespan-dpwv">
            ...
            <TranslatedText
              stringId="note.table.item.readMore"
              fallback="read more"
              data-testid="translatedtext-fpqt"
            />
          </ReadMoreSpan>
        )}
        {contentIsExpanded && (
          <ShowLessSpan onClick={handleReadLess} data-testid="showlessspan-7kuw">
            {' '}
            <TranslatedText
              stringId="note.table.item.showLess"
              fallback="Show less"
              data-testid="translatedtext-frql"
            />
          </ShowLessSpan>
        )}
      </NoteExpandControlContainer>
      <NoteFooterContainer data-testid="notefootercontainer-byhv">
        {showNoteMetaPrefix && (
          <NoteFooterTextElement data-testid="notefootertextelement-sujh">
            <TranslatedText
              stringId="general.lastUpdated.label"
              fallback="Last updated"
              data-testid="translatedtext-ncvx"
            />
            :
          </NoteFooterTextElement>
        )}
        {noteAuthorName ? (
          <NoteFooterTextElement data-testid="notefootertextelement-a9zz">
            {noteAuthorName}
          </NoteFooterTextElement>
        ) : null}
        {noteOnBehalfOfName && (
          <NoteFooterTextElement data-testid="notefootertextelement-2ffz">
            <TranslatedText
              stringId="note.table.onBehalfOfText"
              fallback="on behalf of :changeOnBehalfOfName"
              replacements={{ changeOnBehalfOfName: noteOnBehalfOfName }}
              data-testid="translatedtext-9x5v"
            />
          </NoteFooterTextElement>
        )}
        <DateDisplay
          date={(note.noteTypeId !== NOTE_TYPES.TREATMENT_PLAN && note.revisedBy?.date) || note.date}
          timeFormat="default"
          noTooltip
          data-testid="datedisplay-yaha"
        />
        {note.revisedById && (
          <EditedButtonContainer
            onClick={() => handleViewNoteChangeLog(note)}
            data-testid="editedbuttoncontainer-1q1r"
          >
            <span>(</span>
            <EditedButton data-testid="editedbutton-jn5i">
              <TranslatedText
                stringId="note.table.footer.edited"
                fallback="edited"
                data-testid="translatedtext-ud3f"
              />
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
  noteTypeId,
}) => {
  const { currentUser } = useAuth();
  const { openNoteModal } = useNoteModal();
  const [selectedNote, setSelectedNote] = useState(null);
  const [isNoteChangelogModalOpen, setIsNoteChangelogModalOpen] = useState(false);

  const handleEditNote = useCallback(
    note => {
      if (!hasEncounterNoteWritePermission) {
        return;
      }

      openNoteModal({
        title:
          note.noteTypeId === NOTE_TYPES.TREATMENT_PLAN ? (
            <TranslatedText
              stringId="note.modal.updateTreatmentPlan.title"
              fallback="Update treatment plan"
            />
          ) : (
            <TranslatedText stringId="note.modal.edit.title" fallback="Edit note" />
          ),
        cancelText: <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
        noteFormMode: NOTE_FORM_MODES.EDIT_NOTE,
        note: note,
        onSaved: noteModalOnSaved,
        encounterId,
        confirmText: <TranslatedText stringId="general.action.save" fallback="Save" />,
      });
    },
    [openNoteModal, hasEncounterNoteWritePermission, encounterId, noteModalOnSaved],
  );

  const handleViewNoteChangeLog = useCallback(note => {
    setSelectedNote(note);
    setIsNoteChangelogModalOpen(true);
  }, []);

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
            isNotFilteredByNoteType={!noteTypeId}
            data-testid="notecontent-s6dd"
          />
        ),
        sortable: false,
      },
    ],
    [
      hasEncounterNoteWritePermission,
      currentUser,
      noteTypeId,
      handleEditNote,
      handleViewNoteChangeLog,
    ],
  );

  return (
    <>
      <NoteChangelogModal
        open={isNoteChangelogModalOpen}
        note={selectedNote}
        onCancel={() => setIsNoteChangelogModalOpen(false)}
      />
      <DataFetchingTable
        lazyLoading
        hideHeader
        allowExport={false}
        columns={COLUMNS}
        key={noteTypeId}
        endpoint={`encounter/${encounterId}/notes`}
        fetchOptions={{ noteTypeId }}
        elevated={false}
        noDataBackgroundColor={Colors.background}
        noDataMessage={
          <NoDataMessage data-testid="nodatamessage-78ud">
            {noteTypeId ? (
              <TranslatedText
                stringId="note.table.noDataOfType"
                fallback="This patient has no notes of this type to display. Click ‘New note’ to add a note."
                data-testid="translatedtext-tkm5"
              />
            ) : (
              <TranslatedText
                stringId="note.table.noData"
                fallback="This patient has no notes to display. Click ‘New note’ to add a note."
                data-testid="translatedtext-9ih8"
              />
            )}
          </NoDataMessage>
        }
        rowStyle={rowStyle}
        data-testid="datafetchingtable-qdej"
      />
    </>
  );
};

export const NoteTableWithPermission = withPermissionCheck(NoteTable);
