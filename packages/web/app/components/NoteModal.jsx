import React, { useCallback, useEffect, useState } from 'react';
import { Prompt } from 'react-router-dom';

import { NOTE_RECORD_TYPES, NOTE_TYPES } from '@tamanu/constants';

import { useApi, useSuggester } from '../api';

import { FormModal } from './FormModal';
import { NoteForm } from '../forms/NoteForm';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../contexts/Auth';
import { Colors, NOTE_FORM_MODES } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';
import { withModalFloating } from './withModalFloating';
import { useNoteModal } from '../contexts/NoteModal';

const FloatingFormModal = withModalFloating(FormModal);

const getOnBehalfOfId = (noteFormMode, currentUserId, newData, note) => {
  // When editing non treatment plan notes, we just want to retain the previous onBehalfOfId;
  if (noteFormMode === NOTE_FORM_MODES.EDIT_NOTE && note.noteType !== NOTE_TYPES.TREATMENT_PLAN) {
    return note.onBehalfOfId;
  }

  // Otherwise, the Written by field is editable, check if it is the same as current user to populate on behalf of
  return newData.writtenById && currentUserId !== newData.writtenById
    ? newData.writtenById
    : undefined;
};

export const NoteModalComponent = ({
  title = <TranslatedText stringId="note.modal.default.title" fallback="Note" />,
  open,
  onClose,
  onSaved,
  encounterId,
  note,
  noteFormMode,
  confirmText,
  cancelText,
}) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const [noteTypeCountByType, setNoteTypeCountByType] = useState({});
  const [openNoteCancelConfirmModal, setOpenNoteCancelConfirmModal] = useState(false);

  const practitionerSuggester = useSuggester('practitioner');

  useEffect(() => {
    (async () => {
      const noteTypeCountResponse = await api.get(`encounter/${encounterId}/notes/noteTypes`);
      setNoteTypeCountByType(noteTypeCountResponse.data);
    })();
  }, [api, note, encounterId]);

  const handleCreateOrEditNewNote = useCallback(
    async (data, { resetForm }) => {
      const newNote = {
        ...data,
        authorId: currentUser.id,
        onBehalfOfId: getOnBehalfOfId(noteFormMode, currentUser.id, data, note),
        ...(note
          ? {
              recordType: note.recordType,
              recordId: note.recordId,
              noteType: note.noteType,
              revisedById: note.revisedById || note.id,
            }
          : {
              recordId: encounterId,
              recordType: NOTE_RECORD_TYPES.ENCOUNTER,
            }),
      };

      const createdNote = await api.post('notes', newNote);

      resetForm();
      onSaved(createdNote);
    },
    [api, noteFormMode, currentUser.id, encounterId, note, onSaved],
  );

  return (
    <>
      <ConfirmModal
        title={<TranslatedText stringId="note.modal.delete.title" fallback="Discard note" />}
        open={openNoteCancelConfirmModal}
        width="sm"
        onCancel={() => setOpenNoteCancelConfirmModal(false)}
        onConfirm={() => {
          setOpenNoteCancelConfirmModal(false);
          onClose();
        }}
        customContent={
          <p>
            <TranslatedText
              stringId="note.modal.delete.confirmText"
              fallback="Are you sure you want to remove any changes you have made?"
            />
          </p>
        }
      />
      <FloatingFormModal
        title={title}
        open={open}
        onClose={onClose}
        color={Colors.white}
        baseWidth={535}
        baseHeight={775}
        minConstraints={[400, 370]}
        maxConstraints={[535, 775]}
      >
        <NoteForm
          noteFormMode={noteFormMode}
          onSubmit={handleCreateOrEditNewNote}
          practitionerSuggester={practitionerSuggester}
          note={note}
          noteTypeCountByType={noteTypeCountByType}
          confirmText={confirmText}
          cancelText={cancelText}
        />
      </FloatingFormModal>
    </>
  );
};

export const NoteModal = React.memo(() => {
  const { isNoteModalOpen, noteModalProps, closeNoteModal } = useNoteModal();

  return (
    <>
      {/* <Prompt
        when={isNoteModalOpen}
        message="You have unsaved changes in the note. Are you sure you want to leave?"
      /> */}
      <NoteModalComponent {...noteModalProps} open={isNoteModalOpen} onClose={closeNoteModal} />
    </>
  );
});
