import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useHistory, matchPath } from 'react-router-dom';
import styled from 'styled-components';
import MuiDialog from '@mui/material/Dialog';

import { NOTE_RECORD_TYPES, NOTE_TYPES } from '@tamanu/constants';
import { useApi } from '../../api';
import { NoteForm } from '../../forms/NoteForm';
import { ConfirmModal } from '../ConfirmModal';
import { useAuth } from '../../contexts/Auth';
import { useTranslation } from '../../contexts/Translation';
import { NOTE_FORM_MODES } from '../../constants';
import { PATIENT_PATHS } from '../../constants/patientPaths';
import { TranslatedText } from '../Translation/TranslatedText';
import { withModalFloating } from '../withModalFloating';
import { useNoteModal } from '../../contexts/NoteModal';
import { NoteModalDialogTitle } from './NoteModalCommonComponents';
import { useMediaQuery } from '@mui/material';

const NOTE_MODAL_DIMENSIONS = {
  BREAKPOINTS: {
    HEIGHT: 850, // px
  },
  WIDTH: {
    BASE: 500,
    MIN: 400,
    MAX: 500,
  },
  HEIGHT: {
    BASE: 500,
    MIN_DEFAULT: 450,
    MIN_TREATMENT_PLAN: 500,
    MAX_DEFAULT: 500,
    MAX_TALL: 775,
  },
};

const StyledMuiDialog = styled(MuiDialog)`
  /* Make the form take up full height */
  form {
    display: flex !important;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .MuiDialog-paper {
    overflow-x: hidden;
  }

  .MuiDialogContent-root {
    overflow-x: hidden;
  }
`;

const StyledConfirmModal = styled(ConfirmModal)`
  &.MuiDialog-root {
    z-index: 1600 !important;
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

const MemoizedNoteModalContents = React.memo(
  ({
    open,
    onClose,
    noteFormMode,
    note,
    title,
    noteTypeCountByType,
    confirmText,
    cancelText,
    handleCreateOrEditNewNote,
  }) => {
    const { BREAKPOINTS, WIDTH, HEIGHT } = NOTE_MODAL_DIMENSIONS;

    const isHeightBreakpoint = useMediaQuery(`(min-height: ${BREAKPOINTS.HEIGHT}px)`);
    const isTreatmentPlanEdit =
      noteFormMode === NOTE_FORM_MODES.EDIT_NOTE && note.noteType === NOTE_TYPES.TREATMENT_PLAN;

    const minConstraints = useMemo(() => {
      if (isTreatmentPlanEdit) {
        return [WIDTH.MIN, HEIGHT.MIN_TREATMENT_PLAN];
      }
      return [WIDTH.MIN, HEIGHT.MIN_DEFAULT];
    }, [isTreatmentPlanEdit, WIDTH, HEIGHT]);

    const maxConstraints = useMemo(() => {
      const height = isHeightBreakpoint ? HEIGHT.MAX_TALL : HEIGHT.MAX_DEFAULT;
      return [WIDTH.MAX, height];
    }, [isHeightBreakpoint, WIDTH, HEIGHT]);

    return (
      <FloatingMuiDialog
        open={open}
        onClose={onClose}
        baseWidth={WIDTH.BASE}
        baseHeight={isHeightBreakpoint ? HEIGHT.MAX_TALL : HEIGHT.BASE}
        minConstraints={minConstraints}
        maxConstraints={maxConstraints}
      >
        <NoteModalDialogTitle title={title} onClose={onClose} />
        <NoteForm
          noteFormMode={noteFormMode}
          onCancel={onClose}
          onSubmit={handleCreateOrEditNewNote}
          note={note}
          noteTypeCountByType={noteTypeCountByType}
          confirmText={confirmText}
          cancelText={cancelText}
        />
      </FloatingMuiDialog>
    );
  },
);

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
  const onCancel = useCallback(() => {
    setOpenNoteCancelConfirmModal(true);
  }, []);

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
      onClose();
    },
    [api, noteFormMode, currentUser.id, encounterId, note, onSaved, onClose],
  );

  return (
    <>
      <StyledConfirmModal
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
      <MemoizedNoteModalContents
        open={open}
        onClose={onCancel}
        noteFormMode={noteFormMode}
        note={note}
        title={title}
        noteTypeCountByType={noteTypeCountByType}
        confirmText={confirmText}
        cancelText={cancelText}
        handleCreateOrEditNewNote={handleCreateOrEditNewNote}
      />
    </>
  );
};

export const NoteModal = React.memo(() => {
  const { isNoteModalOpen, noteModalProps, closeNoteModal } = useNoteModal();
  const handleBeforeUnloadRef = React.useRef(null);
  const unblockRef = React.useRef(null);
  const history = useHistory();
  const { getTranslation } = useTranslation();

  useEffect(() => {
    handleBeforeUnloadRef.current = e => {
      e.preventDefault();
      e.returnValue = '';
    };

    if (isNoteModalOpen) {
      window.addEventListener('beforeunload', handleBeforeUnloadRef.current);
      unblockRef.current = history.block(location => {
        if (matchPath(location.pathname, PATIENT_PATHS.PATIENT)) {
          return true;
        }

        const confirmed = window.confirm(
          getTranslation(
            'note.modal.backBlock.confirm',
            'You have a patient note in progress. If you leave this page, you will lose your changes.',
          ),
        );
        if (confirmed) {
          closeNoteModal();

          setTimeout(() => {
            unblockRef.current();
            history.push(location.pathname);
          }, 0);
        }

        return false;
      });
    }

    return () => {
      if (handleBeforeUnloadRef.current) {
        window.removeEventListener('beforeunload', handleBeforeUnloadRef.current);
      }
      if (unblockRef.current) {
        unblockRef.current();
      }
    };
  }, [isNoteModalOpen, history, closeNoteModal]);

  return (
    <>
      <MuiNoteModalComponent {...noteModalProps} open={isNoteModalOpen} onClose={closeNoteModal} />
    </>
  );
});
