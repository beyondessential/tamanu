import React, { useCallback, useEffect, useState } from 'react';

import { NOTE_RECORD_TYPES, NOTE_TYPES } from '@tamanu/constants';

import { useApi, useSuggester } from '../api';

import { FormModal } from './FormModal';
import { NoteForm } from '../forms/NoteForm';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../contexts/Auth';
import { NOTE_FORM_MODES } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';

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

export const NoteModal = ({
  title = (
    <TranslatedText
      stringId="note.modal.default.title"
      fallback="Note"
      data-testid="translatedtext-pcq6"
    />
  ),
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
  const [noteContent, setNoteContent] = useState(note?.content);

  const noteContentHasChanged = (noteContent || '') !== (note?.content || '');

  const practitionerSuggester = useSuggester('practitioner');

  useEffect(() => {
    (async () => {
      const noteTypeCountResponse = await api.get(`encounter/${encounterId}/notes/noteTypes`);
      setNoteTypeCountByType(noteTypeCountResponse.data);
    })();
  }, [api, note, encounterId]);

  useEffect(() => {
    setNoteContent(note?.content);
  }, [note]);

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

      await api.post('notes', newNote);

      resetForm();
      onSaved();
    },
    [api, noteFormMode, currentUser.id, encounterId, note, onSaved],
  );

  return (
    <>
      <ConfirmModal
        title={
          <TranslatedText
            stringId="note.modal.delete.title"
            fallback="Discard note"
            data-testid="translatedtext-34nt"
          />
        }
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
              data-testid="translatedtext-z1mp"
            />
          </p>
        }
        data-testid="confirmmodal-6bg6"
      />
      <FormModal
        title={title}
        open={open}
        width="lg"
        onClose={() => {
          if (noteContentHasChanged) {
            setOpenNoteCancelConfirmModal(true);
          } else {
            onClose();
          }
        }}
        data-testid="formmodal-lp3s"
      >
        <NoteForm
          noteFormMode={noteFormMode}
          onSubmit={handleCreateOrEditNewNote}
          onCancel={() => {
            if (noteContentHasChanged) {
              setOpenNoteCancelConfirmModal(true);
            } else {
              onClose();
            }
          }}
          practitionerSuggester={practitionerSuggester}
          note={note}
          noteTypeCountByType={noteTypeCountByType}
          confirmText={confirmText}
          cancelText={cancelText}
          noteContent={noteContent}
          setNoteContent={setNoteContent}
          data-testid="noteform-wj2l"
        />
      </FormModal>
    </>
  );
};
