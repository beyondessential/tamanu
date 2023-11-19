import React from 'react';
import { dialog } from '@electron/remote';
import { shell } from 'electron';
import { readFile, writeFile, stat } from 'fs/promises';

import { ElectronContext } from './Electron';

import { printPage } from '../print';

export const ElectronProvider = ({ children }) => {
  // just pass directly to electron
  const showOpenDialog = (...args) => dialog.showOpenDialog(...args);
  const showSaveDialog = (...args) => dialog.showSaveDialog(...args);
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
        writeFile,
        getFileStatus: stat,
      }}
    >
      {children}
    </ElectronContext.Provider>
  );
};
