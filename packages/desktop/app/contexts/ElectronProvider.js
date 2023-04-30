import React from 'react';
import { remote, shell } from 'electron';

import { ElectronContext } from './Electron';

import { printPage } from '../print';

export const ElectronProvider = ({ children }) => {
  // just pass directly to electron
  const showOpenDialog = (...args) => remote.dialog.showOpenDialog(...args);
  const showSaveDialog = (...args) => remote.dialog.showSaveDialog(...args);
  const openPath = path => shell.openPath(path);
  const showItemInFolder = path => shell.showItemInFolder(path);

  return (
    <ElectronContext.Provider
      value={{
        showOpenDialog,
        showSaveDialog,
        showItemInFolder,
        openPath,
        printPage,
      }}
    >
      {children}
    </ElectronContext.Provider>
  );
};
