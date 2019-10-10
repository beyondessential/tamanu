import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';

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
