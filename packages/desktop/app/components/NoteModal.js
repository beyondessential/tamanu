import React, { useState, useEffect, useCallback } from 'react';
import { NOTE_RECORD_TYPES } from '@tamanu/shared/constants';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { NoteForm } from '../forms/NoteForm';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../contexts/Auth';

export { NOTE_FORM_MODES } from '../forms/NoteForm';

export const NoteModal = ({
  title = 'Note',
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

  const practitionerSuggester = new Suggester(api, 'practitioner');

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
        onBehalfOfId:
          data.writtenById && currentUser.id !== data.writtenById ? data.writtenById : undefined,
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
    [api, currentUser.id, encounterId, note, onSaved],
  );

  return (
    <>
      <ConfirmModal
        title="Discard note"
        open={openNoteCancelConfirmModal}
        width="sm"
        onCancel={() => setOpenNoteCancelConfirmModal(false)}
        onConfirm={() => {
          setOpenNoteCancelConfirmModal(false);
          onClose();
        }}
        customContent={<p>Are you sure you want to remove any changes you have made?</p>}
      />
      <Modal
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
        />
      </Modal>
    </>
  );
};
