import React, { useState } from 'react';
import { useProgramRegistryContext, ProgramRegistryContext } from '@tamanu/ui-components';
import { useApi } from '../api';

export { useProgramRegistryContext };

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
