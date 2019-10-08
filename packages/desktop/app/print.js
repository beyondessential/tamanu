import { ipcRenderer } from 'electron';

export const PRINT_EVENT = 'print-page';

export const printPage = () => ipcRenderer.send(PRINT_EVENT);
