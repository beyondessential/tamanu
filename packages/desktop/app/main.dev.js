/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/dist/main.prod.js` using webpack. This gives us some performance wins.
 *
 */
import { app, BrowserWindow } from 'electron';

// production only
import sourceMapSupport from 'source-map-support';

// debug only
// TODO: exclude these from production builds entirely
// NOTE: all debug stuff currently commented out in order to get a
// import electronDebug from 'electron-debug';
// import installExtension, { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } from 'electron-devtools-installer';

import MenuBuilder from './menu';

let mainWindow = null;

const isProduction = (process.env.NODE_ENV === 'production');
// const isDebug = (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true');

if (isProduction) {
  sourceMapSupport.install();
}

// if (isDebug) {
//   electronDebug();
// }

const installExtensions = async () => {
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;

  const install = async (extension) => {
    try {
      const name = await installExtension(extension.id, forceDownload);
      console.log('Installed extension:', name);
    } catch (e) {
      console.error(e);
    }
  };

  await install(REACT_DEVELOPER_TOOLS);
  await install(REDUX_DEVTOOLS);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  // if (isDebug) {
  //   await installExtensions();
  // }

  mainWindow = new BrowserWindow({
    show: false,
    // width: 1024,
    // height: 728
    width: 1500,
    height: 900,
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
