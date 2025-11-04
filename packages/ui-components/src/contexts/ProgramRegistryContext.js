import { createContext, useContext } from 'react';

export const ProgramRegistryContext = createContext({
  programRegistryId: null,
  setProgramRegistryId: () => {},
  setProgramRegistryIdByProgramId: () => {},
});

export const useProgramRegistryContext = () => useContext(ProgramRegistryContext);
