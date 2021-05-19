import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import React from 'react';
import { createPortal } from 'react-dom';

export const PRINT_EVENT = 'print-page';

export const printPage = () => ipcRenderer.send(PRINT_EVENT);

export function registerPrintListener() {
  ipcMain.on(PRINT_EVENT, event => {
    const win = BrowserWindow.fromWebContents(event.sender);

    win.webContents.print({}, (error, data) => {
      if (error) return console.log(error.message);
    });
  });
}

export const PrintPortal = React.memo(({ children }) => {
  const el = document.createElement('div');

  React.useEffect(() => {
    const root = document.querySelector('#print-root');
    root.appendChild(el);
    return () => {
      root.removeChild(el);
    };
  });

  return createPortal(children, el);
});
