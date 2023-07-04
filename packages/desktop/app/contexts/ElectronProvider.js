import React from 'react';

import { ElectronContext } from './Electron';

import { printPage } from '../print';

export const ElectronProvider = ({ children }) => {
  // just pass directly to electron
  const showOpenDialog = (...args) => {};
  const showSaveDialog = (...args) => {};
  const openPath = path => {};

  return (
    <ElectronContext.Provider
      value={{
        showOpenDialog,
        showSaveDialog,
        openPath,
        printPage,
      }}
    >
      {children}
    </ElectronContext.Provider>
  );
};
