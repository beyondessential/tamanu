import React, { FC, createContext, useContext, useState } from 'react';

interface VaccineFormRefreshContextData {
  refreshCount: number;
  handleRefresh: () => void;
}

const VaccineFormRefreshContext = createContext<VaccineFormRefreshContextData>(
  {} as VaccineFormRefreshContextData,
);

export const VaccineFormRefreshProvider: FC = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);

  const handleRefresh = () => {
    setRefreshCount(refreshCount + 1);
  };

  return (
    <VaccineFormRefreshContext.Provider value={{ refreshCount, handleRefresh }}>
      {children}
    </VaccineFormRefreshContext.Provider>
  );
};

export const useVaccineFormRefresh = (): VaccineFormRefreshContextData =>
  useContext(VaccineFormRefreshContext);
