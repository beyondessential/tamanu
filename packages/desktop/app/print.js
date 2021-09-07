import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';

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
