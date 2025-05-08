import React, { useCallback, useEffect, useState } from 'react';

import { NOTE_RECORD_TYPES, NOTE_TYPES } from '@tamanu/constants';

import { useApi, useSuggester } from '../api';
import styled from 'styled-components';
import MuiDialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import { Box } from '@material-ui/core';

import { NoteForm } from '../forms/NoteForm';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../contexts/Auth';
import { Colors, NOTE_FORM_MODES } from '../constants';
import { TranslatedText } from './Translation/TranslatedText';
import { withModalFloating } from './withModalFloating';
import { useNoteModal } from '../contexts/NoteModal';

const StyledMuiDialog = styled(MuiDialog)`
  /* Make the form take up full height */
  form {
    display: flex !important;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
`;

const FloatingMuiDialog = withModalFloating(StyledMuiDialog);

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

export const MuiNoteModalComponent = ({
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
      <FloatingMuiDialog
        open={open}
        onClose={onClose}
        baseWidth={535}
        baseHeight={775}
        minConstraints={[400, 370]}
        maxConstraints={[535, 775]}
      >
        <DialogTitle style={{ borderBottom: `1px solid ${Colors.softOutline}`, padding: 0 }}>
          <Box
            display="flex"
            alignItems="center"
            width="100%"
            justifyContent="space-between"
            paddingY="10px"
            paddingX="19px"
            fontSize="14px"
          >
            {title}
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <NoteForm
          noteFormMode={noteFormMode}
          onSubmit={handleCreateOrEditNewNote}
          practitionerSuggester={practitionerSuggester}
          note={note}
          noteTypeCountByType={noteTypeCountByType}
          confirmText={confirmText}
          cancelText={cancelText}
        />
      </FloatingMuiDialog>
    </>
  );
};

export const NoteModal = React.memo(() => {
  const { isNoteModalOpen, noteModalProps, closeNoteModal } = useNoteModal();
  const handleBeforeUnloadRef = React.useRef(null);

  useEffect(() => {
    // Create the handler function and store it in the ref
    handleBeforeUnloadRef.current = e => {
      e.preventDefault();
      e.returnValue = '';
    };

    if (isNoteModalOpen) {
      window.addEventListener('beforeunload', handleBeforeUnloadRef.current);
    }

    return () => {
      if (handleBeforeUnloadRef.current) {
        window.removeEventListener('beforeunload', handleBeforeUnloadRef.current);
      }
    };
  }, [isNoteModalOpen]);

  console.log('📝 NoteModal render:', { isNoteModalOpen, noteModalProps });
  return (
    <MuiNoteModalComponent {...noteModalProps} open={isNoteModalOpen} onClose={closeNoteModal} />
  );
});
