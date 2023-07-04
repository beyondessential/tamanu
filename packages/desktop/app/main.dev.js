/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/dist/main.prod.js` using webpack. This gives us some performance wins.
 *
 */
// import { autoUpdater } from 'electron-updater';
// import { app, BrowserWindow } from 'electron';
// import installExtension, {
//   REDUX_DEVTOOLS,
//   REACT_DEVELOPER_TOOLS,
// } from 'electron-devtools-installer';

// import {findCountryLocales} from 'iso-lang-codes'

// // production only
// import sourceMapSupport from 'source-map-support';

// // debug only
// // TODO: exclude these from production builds entirely
// import electronDebug from 'electron-debug';

// import MenuBuilder from './menu';
// import { registerPrintListener } from './print';

// const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // check for updates every hour

// let mainWindow = null;

// const isProduction = process.env.NODE_ENV === 'production';
// const isDebug = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// if (isProduction) {
//   sourceMapSupport.install();
// }

// // if (isDebug) { temporarily allowing debug on prod
// electronDebug({ isEnabled: true });
// // }

// /**
//  * Add event listeners...
//  */

// app.on('window-all-closed', () => {
//   // Respect the OSX convention of having the application in memory even
//   // after all windows have been closed
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('ready', async () => {
//   mainWindow = new BrowserWindow({
//     show: false,
//     // width: 1024,
//     // height: 728
//     width: 1500,
//     height: 900,
//     webPreferences: {
//       nodeIntegration: true,
//       contextIsolation: false,
//       enableRemoteModule: true,
//     },
//   });

//   // The most accurate method of getting locale in electron is getLocaleCountryCode
//   // which unlike getLocale is determined by native os settings
//   const osLocales = findCountryLocales(app.getLocaleCountryCode())
//   global.osLocales = osLocales;

//   const htmlLocation =
//     __dirname.indexOf('dist') > 0
//       ? `file://${__dirname}/../app.html`
//       : `file://${__dirname}/app.html`;
//   mainWindow.loadURL(htmlLocation);

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

//   // @TODO: Use 'ready-to-show' event
//   //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
//   mainWindow.webContents.on('did-finish-load', () => {
//     if (!mainWindow) {
//       throw new Error('"mainWindow" is not defined');
//     }
//     if (process.env.START_MINIMIZED) {
//       mainWindow.minimize();
//     } else {
//       mainWindow.showInactive();
//     }
//   });

//   mainWindow.on('closed', () => {
//     mainWindow = null;
//   });

//   const menuBuilder = new MenuBuilder(mainWindow);
//   menuBuilder.buildMenu();
// });

// // if (isDebug) {
// app.whenReady().then(() => {
//   installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
//     .then(name => console.log(`Added Extension:  ${name}`))
//     .catch(err => console.log('An error occurred: ', err));
// });
// // }

// registerPrintListener();
