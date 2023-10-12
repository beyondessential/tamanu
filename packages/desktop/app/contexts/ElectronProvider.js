import React from 'react';
import { remote, shell, ipcRenderer } from 'electron';
import { readFile, writeFile, stat } from 'fs/promises';

import { ElectronContext } from './Electron';

import { printPage } from '../print';

ipcRenderer.on('toggleTranslationDebug', () => {
  localStorage.setItem('debugTranslation', !JSON.parse(localStorage.getItem('debugTranslation')));
  window.dispatchEvent(new Event('debugTranslation'));
});

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
        writeFile,
        getFileStatus: stat,
      }}
    >
      {children}
    </ElectronContext.Provider>
  );
};
