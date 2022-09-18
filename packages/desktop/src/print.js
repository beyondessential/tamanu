// TODO
export const PRINT_EVENT = 'print-page';

export const printPage = (options = {}) => {
  // ipcRenderer.send(PRINT_EVENT, options);
};

export function registerPrintListener() {
  // ipcMain.on(PRINT_EVENT, (event, options) => {
  //   const win = BrowserWindow.fromWebContents(event.sender);
  //   win.webContents.print(options, (success, failureReason) => {
  //     if (!success) {
  //       // eslint-disable-next-line no-console
  //       console.error(failureReason);
  //     }
  //   });
  // });
}
