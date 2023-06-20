import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../api';
import { useLocalisation } from './Localisation';

const NoteTypesContext = React.createContext({
  noteTypes: [],
  isLoadingNoteTypes: false,
  configurationNoteTypeIds: {},
});

export const useNoteTypes = () => useContext(NoteTypesContext);

export const NoteTypesProvider = ({ children }) => {
  const { getLocalisation } = useLocalisation();
  const configurationNoteTypeIds = getLocalisation('noteTypeIds');

  const api = useApi();
  const { data: noteTypes, isLoading: isLoadingNoteTypes } = useQuery({
    queryKey: ['noteTypesReferenceData'],
    queryFn: () => api.get('referenceData/noteType/all'),
    select: ({ data: types }) =>
      types.map(type => ({
        value: type.id,
        label: type.name,
        visibilityStatus: type.visibilityStatus,
      })),
  });

  return (
    <NoteTypesContext.Provider
      value={{
        noteTypes,
        isLoadingNoteTypes,
        configurationNoteTypeIds,
      }}
    >
      {children}
    </NoteTypesContext.Provider>
  );
};
