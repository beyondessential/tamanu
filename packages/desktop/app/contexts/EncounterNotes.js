import React, { useContext, createContext, useState } from 'react';

const EncounterNotesContext = createContext({
  noteType: null,
  setNoteType: () => {},
});

export const useEncounterNotes = () => {
  const { noteType, setNoteType } = useContext(EncounterNotesContext);
  return { noteType, setNoteType };
};

export const EncounterNotesProvider = ({ children }) => {
  const [noteType, setNoteType] = useState(null);

  return (
    <EncounterNotesContext.Provider
      value={{
        noteType,
        setNoteType,
      }}
    >
      {children}
    </EncounterNotesContext.Provider>
  );
};
