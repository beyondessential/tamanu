import React, { createContext, useContext, useState } from 'react';

const EncounterNotesContext = createContext({
  noteType: '',
  setNoteType: () => {},
  resetNoteContext: () => {},
});

export const useEncounterNotes = () => {
  const { noteType, setNoteType, resetNoteContext } = useContext(EncounterNotesContext);
  return { noteType, setNoteType, resetNoteContext };
};

export const EncounterNotesProvider = ({ children }) => {
  const [noteType, setNoteType] = useState('');
  const resetNoteContext = () => {
    setNoteType('');
  };

  return (
    <EncounterNotesContext.Provider
      value={{
        noteType,
        setNoteType,
        resetNoteContext,
      }}
    >
      {children}
    </EncounterNotesContext.Provider>
  );
};
