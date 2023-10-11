import React, { createContext, useContext } from 'react';

export const ProgramRegistryContext = createContext({
  programRegistryId: null,
});

export const useProgramRegistry = () => useContext(ProgramRegistryContext);

export const ProgramRegistryProvider = ProgramRegistryContext.Provider;
