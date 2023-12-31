import React, { useContext, createContext, useState } from 'react';

const EncounterNotesContext = createContext({
  noteType: null,
  setNoteType: () => {},
  resetNoteContext: () => {},
});

export const useEncounterNotes = () => {
  const { noteType, setNoteType, resetNoteContext } = useContext(EncounterNotesContext);
  return { noteType, setNoteType, resetNoteContext };
};

export const EncounterNotesProvider = ({ children }) => {
  const [noteType, setNoteType] = useState(null);
  const resetNoteContext = () => {
    setNoteType(null);
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
