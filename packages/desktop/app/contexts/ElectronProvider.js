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
  const showItemInFolder = path => shell.showItemInFolder(path);
  const openUrl = url => shell.openExternal(url);

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
      }}
    >
      {children}
    </ElectronContext.Provider>
  );
};
