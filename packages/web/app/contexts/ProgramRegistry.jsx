import React, { createContext, useContext, useState } from 'react';
import { useApi } from '../api';

export const ProgramRegistryContext = createContext({
  programRegistryId: null,
  setProgramRegistryId: () => {},
  setProgramRegistryIdByProgramId: () => {},
});

export const useProgramRegistryContext = () => useContext(ProgramRegistryContext);

export const ProgramRegistryProvider = ({ children }) => {
  const [programRegistryId, setProgramRegistryId] = useState(null);
  const api = useApi();
  const setProgramRegistryIdByProgramId = async programId => {
    if (!programId) {
      setProgramRegistryId(null);
      return;
    }
    const { programRegistries } = await api.get(`program/${programId}`);
    if (programRegistries.length > 0) {
      setProgramRegistryId(programRegistries[0].id);
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
