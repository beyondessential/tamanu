import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

import { useAuth } from './Auth';

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

  // A note in progress belongs to the session that opened it, so logging out (by hand or on idle
  // timeout) discards it rather than reopening it, and blocking navigation, at the next login.
  const { currentUser } = useAuth();
  const isUserLoggedIn = Boolean(currentUser);
  const [wasUserLoggedIn, setWasUserLoggedIn] = useState(isUserLoggedIn);
  if (isUserLoggedIn !== wasUserLoggedIn) {
    setWasUserLoggedIn(isUserLoggedIn);
    if (!isUserLoggedIn) {
      setIsNoteModalOpen(false);
      setNoteModalProps({});
    }
  }

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
