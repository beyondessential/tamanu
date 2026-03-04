import React, { createContext, useContext, useState } from 'react';

const EncounterNotesContext = createContext({
  noteTypeId: '',
  setNoteTypeId: () => {},
  resetNoteContext: () => {},
});

export const useEncounterNotesQuery = () => {
  const { noteTypeId, setNoteTypeId, resetNoteContext } = useContext(EncounterNotesContext);
  return { noteTypeId, setNoteTypeId, resetNoteContext };
};

export const EncounterNotesProvider = ({ children }) => {
  const [noteTypeId, setNoteTypeId] = useState('');
  const resetNoteContext = () => {
    setNoteTypeId('');
  };

  return (
    <EncounterNotesContext.Provider
      value={{
        noteTypeId,
        setNoteTypeId,
        resetNoteContext,
      }}
    >
      {children}
    </EncounterNotesContext.Provider>
  );
};
