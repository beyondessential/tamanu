import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import React from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';

export const PRINT_EVENT = 'print-page';

export const printPage = (options = {}) => ipcRenderer.send(PRINT_EVENT, options);

export function registerPrintListener() {
  ipcMain.on(PRINT_EVENT, (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);

    win.webContents.print(options, (success, failureReason) => {
      if (!success) {
        console.error(failureReason);
      }
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

export const LetterPage = styled.div`
  background: white;
  width: 8.5in;
  height: 11in;
`;

