import React, { useState, useContext } from 'react';

// use dummy functions by default - these get overriden
// with real functionality in contexts/ElectronProvider
export const ElectronContext = React.createContext({
  // filesystem
  showOpenDialog: async (...args) => {
    console.log("Show open dialog", ...args);
    return [""];
  },
  showSaveDialog: async (...args) => {
    console.log("Show save dialog", ...args);
    return {
      cancelled: false,
      filePath: '',
    };
  },
  openPath: (path) => console.log("Opening path", path),

  // print
  printPage: (options = {}) => console.log("Printing page", options),
});

export const useElectron = () => useContext(ElectronContext);

// actual provider in contexts/ElectronProvider
// (needs to be imported specifically as it introduces dependencies
// on electron, which breaks storybook)
export const DummyElectronProvider = ({ children }) => {
  return (
    <ElectronContext.Provider>
      {children}
    </ElectronContext.Provider>
  );
}
