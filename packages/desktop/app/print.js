import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import React from 'react';
import { createPortal } from 'react-dom';

let __globalShowPrintingPageForTest__ = true;

export const PRINT_EVENT = 'print-page';

export const printPage = () => console.log('Printing! 🎉') ?? (__globalShowPrintingPageForTest__ = !__globalShowPrintingPageForTest__);
// ipcRenderer.send(PRINT_EVENT);

export function registerPrintListener() {
  ipcMain.on(PRINT_EVENT, event => {
    const win = BrowserWindow.fromWebContents(event.sender);

    win.webContents.print({}, (error, data) => {
      if (error) return console.log(error.message);
    });
  });
}

export const PrintPortal = ({ children }) => {
  console.log(__globalShowPrintingPageForTest__);
  return __globalShowPrintingPageForTest__ ? (<div>{children}</div>) : null;
  // const el = document.createElement('div');

  // React.useEffect(() => {
  //   const root = document.querySelector('#print-root');
  //   root.appendChild(el);
  //   return () => {
  //     root.removeChild(el);
  //   };
  // });

  // return createPortal(children, el);
};
