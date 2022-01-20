import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
const fs = require('fs');
const path = require('path');
const os = require('os');

export const PRINT_EVENT = 'print-page';

export const printPage = (options = {}) => ipcRenderer.send(PRINT_EVENT, options);

export function registerPrintListenerOld() {
  ipcMain.on(PRINT_EVENT, (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);

    win.webContents.print(options, (success, failureReason) => {
      if (!success) {
        // eslint-disable-next-line no-console
        console.error(failureReason);
      }
    });
  });
}

export function registerPrintListener() {
  ipcMain.on(PRINT_EVENT, (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);

    // Use default printing options
    const pdfPath = path.join(os.homedir(), 'Desktop', 'temp.pdf');
    win.webContents
      .printToPDF({})
      .then(data => {
        fs.writeFile(pdfPath, data, error => {
          if (error) throw error;
          console.log(`Wrote PDF successfully to ${pdfPath}`);
        });
      })
      .catch(error => {
        console.log(`Failed to write PDF to ${pdfPath}: `, error);
      });
  });
}
