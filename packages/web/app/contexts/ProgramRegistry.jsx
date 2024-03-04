import React, { createContext, useContext, useState } from 'react';

export const ProgramRegistryContext = createContext({
  programRegistryId: null,
  setProgramRegistryId: () => {},
});

export const useProgramRegistry = () => useContext(ProgramRegistryContext);

export const ProgramRegistryProvider = ({ children }) => {
  const [programRegistryId, setProgramRegistryId] = useState(null);

  return (
    <ProgramRegistryContext.Provider
      value={{
        programRegistryId,
        setProgramRegistryId,
      }}
    >
      {children}
    </ProgramRegistryContext.Provider>
  );
};
