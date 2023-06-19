import React, { useState, useEffect, useContext } from 'react';
import { useSuggester } from '../api';

const NoteTypesContext = React.createContext({
  noteTypes: null,
  isLoadingNoteTypes: false,
});

export const useNoteTypes = () => useContext(NoteTypesContext);

export const NoteTypesProvider = ({ children }) => {
  const [noteTypes, setNoteTypes] = useState(null);
  const [isLoadingNoteTypes, setIsLoadingNoteTypes] = useState(false);

  const noteTypeSuggester = useSuggester('noteType');

  useEffect(() => {
    setIsLoadingNoteTypes(true);
    noteTypeSuggester
      .fetch('/all')
      .then(types => {
        setNoteTypes(
          types.map(type => ({
            value: type.id,
            label: type.name,
            visibilityStatus: type.visibilityStatus,
          })),
        );
      })
      .catch(error => {
        // error fetching note types
        // eslint-disable-next-line no-console
        console.log('There was an error fetching note types', error);
      })
      .finally(() => {
        setIsLoadingNoteTypes(false);
      });
  }, [noteTypeSuggester]);

  return (
    <NoteTypesContext.Provider
      value={{
        noteTypes,
        isLoadingNoteTypes,
      }}
    >
      {children}
    </NoteTypesContext.Provider>
  );
};
