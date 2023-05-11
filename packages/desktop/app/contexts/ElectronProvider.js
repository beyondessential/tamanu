import React from 'react';
import { remote, shell } from 'electron';
import { readFile } from 'fs/promises';

import { ElectronContext } from './Electron';

import { printPage } from '../print';

export const ElectronProvider = ({ children }) => {
  // just pass directly to electron
  const showOpenDialog = (...args) => remote.dialog.showOpenDialog(...args);
  const showSaveDialog = (...args) => remote.dialog.showSaveDialog(...args);
  const openPath = path => shell.openPath(path);

  return (
    <ElectronContext.Provider
      value={{
        showOpenDialog,
        showSaveDialog,
        openPath,
        printPage,
        readFile,
      }}
    >
      {children}
    </ElectronContext.Provider>
  );
};
