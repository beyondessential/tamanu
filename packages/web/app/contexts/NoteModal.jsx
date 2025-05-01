import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const NoteModalContext = createContext({
  openNoteModal: () => {},
  isNoteModalOpen: false,
  closeNoteModal: () => {},
  noteModalProps: {},
  draftContent: '',
  setDraftContent: () => {},
});

export const useNoteModal = () => {
  const {
    openNoteModal,
    isNoteModalOpen,
    closeNoteModal,
    noteModalProps,
    draftContent,
    setDraftContent,
  } = useContext(NoteModalContext);
  return {
    openNoteModal,
    isNoteModalOpen,
    closeNoteModal,
    noteModalProps,
    draftContent,
    setDraftContent,
  };
};

export const NoteModalProvider = ({ children }) => {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteModalProps, setNoteModalProps] = useState({});
  const [draftContent, setDraftContent] = useState('');

  const openNoteModal = useCallback(props => {
    setDraftContent(props.note?.content || '');
    setNoteModalProps(props);
    setIsNoteModalOpen(true);
  }, []);

  const closeNoteModal = useCallback(() => {
    setIsNoteModalOpen(false);
    setNoteModalProps({});
  }, []);

  const contextValue = useMemo(
    () => ({
      isNoteModalOpen,
      openNoteModal,
      closeNoteModal,
      noteModalProps,
      draftContent,
      setDraftContent,
    }),
    [isNoteModalOpen, openNoteModal, closeNoteModal, noteModalProps, draftContent, setDraftContent],
  );

  return <NoteModalContext.Provider value={contextValue}>{children}</NoteModalContext.Provider>;
};
