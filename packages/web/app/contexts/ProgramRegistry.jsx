import React, { createContext, useContext, useState } from 'react';
import { useListOfProgramRegistryQuery } from '../api/queries/useProgramRegistryQuery';

export const ProgramRegistryContext = createContext({
  programRegistryId: null,
  setProgramRegistryId: () => {},
  setProgramRegistryIdByProgramId: () => {},
});

export const useProgramRegistryContext = () => useContext(ProgramRegistryContext);

export const ProgramRegistryProvider = ({ children }) => {
  const [programRegistryId, setProgramRegistryId] = useState(null);
  const { data: programRegistries, refetch } = useListOfProgramRegistryQuery();
  const setProgramRegistryIdByProgramId = async programId => {
    await refetch();
    const programRegistry = programRegistries.data.find(pr => pr.programId === programId);
    if (programRegistry) {
      setProgramRegistryId(programRegistry.id);
      return;
    }
    setProgramRegistryId(null);
  };

  return (
    <ProgramRegistryContext.Provider
      value={{
        programRegistryId,
        setProgramRegistryId,
        setProgramRegistryIdByProgramId,
      }}
    >
      {children}
    </ProgramRegistryContext.Provider>
  );
};
