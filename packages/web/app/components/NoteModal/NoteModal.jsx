import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { matchPath, useBlocker } from 'react-router';
import styled from 'styled-components';
import MuiDialog from '@material-ui/core/Dialog';

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

const NOTE_MODAL_DIMENSIONS = {
  WIDTH: {
    MIN: 480,
    BASE_RATIO: 0.37,
    MAX_RATIO: 0.9,
  },
  HEIGHT: {
    MIN_DEFAULT: 415,
    BASE_RATIO: 0.9,
    MAX_RATIO: 0.9,
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
    const { WIDTH, HEIGHT } = NOTE_MODAL_DIMENSIONS;

    const [viewport, setViewport] = useState({
      vw: window.innerWidth,
      vh: window.innerHeight,
    });

    useEffect(() => {
      const handleResize = () => {
        setViewport({ vw: window.innerWidth, vh: window.innerHeight });
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    const minConstraints = [WIDTH.MIN, HEIGHT.MIN_DEFAULT];

    const maxConstraints = useMemo(() => {
      const maxW = Math.max(WIDTH.MIN, Math.round(viewport.vw * WIDTH.MAX_RATIO));
      const maxH = Math.max(HEIGHT.MIN_DEFAULT, Math.round(viewport.vh * HEIGHT.MAX_RATIO));
      return [maxW, maxH];
    }, [viewport, WIDTH, HEIGHT]);

    const baseWidth = useMemo(
      () => Math.max(WIDTH.MIN, Math.round(viewport.vw * WIDTH.BASE_RATIO)),
      [viewport, WIDTH.MIN, WIDTH.BASE_RATIO],
    );
    const baseHeight = useMemo(
      () => Math.max(HEIGHT.MIN_DEFAULT, Math.round(viewport.vh * HEIGHT.BASE_RATIO)),
      [viewport, HEIGHT.MIN_DEFAULT, HEIGHT.BASE_RATIO],
    );

    return (
      <FloatingMuiDialog
        open={open}
        onClose={onClose}
        baseWidth={baseWidth}
        baseHeight={baseHeight}
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

export const NoteModal = () => {
  const { isNoteModalOpen, noteModalProps, closeNoteModal } = useNoteModal();
  const handleBeforeUnloadRef = React.useRef(null);
  const { getTranslation } = useTranslation();

  const blocker = useBlocker(({ nextLocation }) => {
    // Only block when the note modal is open and navigating outside the patient area
    if (!isNoteModalOpen) {
      return false;
    }
    const nextPath = nextLocation?.pathname || '';
    return !matchPath({ path: PATIENT_PATHS.PATIENT, end: false }, nextPath);
  }, isNoteModalOpen);

  useEffect(() => {
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

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const nextPath = blocker.location?.pathname || '';

      // Allow navigation within the patient area without confirmation
      if (matchPath({ path: PATIENT_PATHS.PATIENT, end: false }, nextPath)) {
        blocker.proceed();
        return;
      }

      const confirmed = window.confirm(
        getTranslation(
          'note.modal.backBlock.confirm',
          'You have a patient note in progress. If you leave this page, you will lose your changes.',
        ),
      );

      if (confirmed) {
        closeNoteModal();
        // Proceed after closing modal to ensure state cleanup occurs first
        setTimeout(() => {
          blocker.proceed();
        }, 0);
      } else {
        blocker.reset();
      }
    }
  }, [blocker, closeNoteModal, getTranslation]);

  return (
    <>
      <MuiNoteModalComponent {...noteModalProps} open={isNoteModalOpen} onClose={closeNoteModal} />
    </>
  );
};
