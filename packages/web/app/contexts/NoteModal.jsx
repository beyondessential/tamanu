import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const NoteModalContext = createContext({
  openNoteModal: () => {},
  isNoteModalOpen: false,
  closeNoteModal: () => {},
  noteModalProps: {},
  updateNoteModalProps: () => {},
});

export const useNoteModal = () => {
  const {
    openNoteModal,
    isNoteModalOpen,
    closeNoteModal,
    noteModalProps,
    updateNoteModalProps,
  } = useContext(NoteModalContext);
  return {
    openNoteModal,
    isNoteModalOpen,
    closeNoteModal,
    noteModalProps,
    updateNoteModalProps,
  };
};

export const NoteModalProvider = ({ children }) => {
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteModalProps, setNoteModalProps] = useState({});

  const openNoteModal = useCallback(props => {
    setNoteModalProps(props);
    setIsNoteModalOpen(true);
  }, []);

  const closeNoteModal = useCallback(() => {
    setIsNoteModalOpen(false);
    setNoteModalProps({});
  }, []);

  const updateNoteModalProps = useCallback(props => {
    setNoteModalProps(prevProps => ({
      ...prevProps,
      ...props,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      isNoteModalOpen,
      openNoteModal,
      closeNoteModal,
      noteModalProps,
      updateNoteModalProps,
    }),
    [isNoteModalOpen, openNoteModal, closeNoteModal, noteModalProps, updateNoteModalProps],
  );

  return <NoteModalContext.Provider value={contextValue}>{children}</NoteModalContext.Provider>;
};
