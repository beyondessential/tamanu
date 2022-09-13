import React from 'react';

import { ElectronContext } from './Electron';

import { printPage } from '../print';

export const ElectronProvider = ({ children }) => {
  // we require require() here as the import is dynamic
  // eslint-disable-next-line global-require
  const { dialog } = require('@electron/remote');

  // just pass directly to electron
  const showOpenDialog = (...args) => {};
  const showSaveDialog = (...args) => {};
  const openPath = path => {};

  return (
    <ElectronContext.Provider
      value={{
        showOpenDialog,
        showSaveDialog,
        showItemInFolder,
        openPath,
        openUrl,
        printPage,
        readFile,
        writeFile,
        getFileStatus: stat,
      }}
    >
      {children}
    </ElectronContext.Provider>
  );
};
