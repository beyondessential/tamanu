import React, { useState, useContext } from 'react';

export const ElectronContext = React.createContext();
export const useElectron = () => useContext(ElectronContext);

// actual provider in contexts/ElectronProvider
// (needs to be imported specifically as it introduces dependencies
// on electron, which breaks storybook)
export const DummyElectronProvider = ({ children }) => {
  return (
    <ElectronContext.Provider 
      value={{
        // filesystem
        showOpenDialog: async (...args) => {
          console.log("Show open dialog", ...args);
          return {
            canceled: false,
            filePaths: ['dummyFile.txt'],
          };
        },
        showSaveDialog: async (...args) => {
          console.log("Show save dialog", ...args);
          return {
            canceled: false,
            filePath: 'dummyFile.txt',
          };
        },
        openPath: (path) => console.log("Opening path", path),

        // print
        printPage: (options = {}) => console.log("Printing page", options),
      }}
    >
      {children}
    </ElectronContext.Provider>
  );
}
