import React, { createContext, useContext } from 'react';

const ExportContext = createContext({ isExporting: false });

export const useExport = () => useContext(ExportContext);

export const ExportProvider = ({ children, isExporting = false }) => (
  <ExportContext.Provider value={{ isExporting }}>{children}</ExportContext.Provider>
);
