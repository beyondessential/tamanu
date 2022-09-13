/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/dist/main.prod.js` using webpack. This gives us some performance wins.
 *
 */
import { NsisUpdater } from 'electron-updater';
import { app, BrowserWindow, ipcMain } from 'electron';
import installExtension, {
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer';

import { findCountryLocales } from 'iso-lang-codes';

// // production only
// import sourceMapSupport from 'source-map-support';

// // debug only
// // TODO: exclude these from production builds entirely
// import electronDebug from 'electron-debug';

// import MenuBuilder from './menu';
// import { registerPrintListener } from './print';

let mainWindow = null;

// const isProduction = process.env.NODE_ENV === 'production';
// const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isProduction) {
  sourceMapSupport.install();
}

require('@electron/remote/main').initialize();

if (isDebug) {
  electronDebug({ isEnabled: true });
}

// // if (isDebug) { temporarily allowing debug on prod
// electronDebug({ isEnabled: true });
// // }

// /**
//  * Add event listeners...
//  */

app.on('ready', async () => {
  // testers can run multiple instances of the app mode by passing the --multi-window flag
  const singleInstanceOnly = !process.argv.includes('--multi-window');

  // Check if there's already an instance of the app running. If there is, we can quit this one, and
  // the other will receive a 'second-instance' event telling it to focus its window (see below)
  if (singleInstanceOnly) {
    const isFirstInstance = app.requestSingleInstanceLock();
    if (!isFirstInstance && !multiWindow) {
      app.quit();
      return;
    }
  }

  mainWindow = new BrowserWindow({
    show: false,
    // width: 1024,
    // height: 728
    width: 1500,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  require('@electron/remote/main').enable(mainWindow.webContents);

  // The most accurate method of getting locale in electron is getLocaleCountryCode
  // which unlike getLocale is determined by native os settings
  const osLocales = findCountryLocales(app.getLocaleCountryCode());
  global.osLocales = osLocales;

//   // The most accurate method of getting locale in electron is getLocaleCountryCode
//   // which unlike getLocale is determined by native os settings
//   const osLocales = findCountryLocales(app.getLocaleCountryCode())
//   global.osLocales = osLocales;

  ipcMain.handle('update-available', (_event, host) => {
    const autoUpdater = new NsisUpdater({
      provider: 'generic',
      url: `${host}/upgrade`,
    });
    const notificationDetails = {
      title: 'A new update is ready to install',
      body: `To update to {version}, please close {appName} and wait for 30 seconds before re-opening.`,
    };

    autoUpdater.checkForUpdatesAndNotify(notificationDetails);
  });

//   mainWindow.on('ready-to-show', () => {
//     const notificationDetails = {
//       title: 'A new update is ready to install',
//       body: `To update to {version}, please close {appName} and wait for 30 seconds before re-opening.`,
//     };
//     autoUpdater.checkForUpdatesAndNotify(notificationDetails);
//     setInterval(
//       () => autoUpdater.checkForUpdatesAndNotify(notificationDetails),
//       UPDATE_CHECK_INTERVAL,
//     );
//   });

  // To open redirect link in default browser
  mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });

app.on('second-instance', () => {
  // This is called when a second instance of the app is attempted to be run (i.e., when it calls
  // requestSingleInstanceLock and fails)
  // Focus the existing mainWindow, that other instance will take care of quitting itself (see above)
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }
});

if (isDebug) {
  app.whenReady().then(() => {
    installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
      .then(name => console.log(`Added Extension:  ${name}`))
      .catch(err => console.log('An error occurred: ', err));
  });
}

// // if (isDebug) {
// app.whenReady().then(() => {
//   installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
//     .then(name => console.log(`Added Extension:  ${name}`))
//     .catch(err => console.log('An error occurred: ', err));
// });
// // }

// registerPrintListener();
