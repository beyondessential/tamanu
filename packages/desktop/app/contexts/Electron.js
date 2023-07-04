import React, { useContext } from 'react';

export const ElectronContext = React.createContext();
export const useElectron = () => useContext(ElectronContext);

// actual provider in contexts/ElectronProvider
// (needs to be imported specifically as it introduces dependencies
// on electron, which breaks storybook)
export const DummyElectronProvider = ({ children }) => (
  <ElectronContext.Provider
    value={{
      // filesystem
      showOpenDialog: async (...args) => {
        // eslint-disable-next-line no-console
        console.log('Show open dialog', ...args);
        return {
          canceled: false,
          filePaths: ['dummyFile.txt'],
        };
      },
      showSaveDialog: async (...args) => {
        // eslint-disable-next-line no-console
        console.log('Show save dialog', ...args);
        return {
          canceled: false,
          filePath: 'dummyFile.txt',
        };
      },
      // eslint-disable-next-line no-console
      openPath: path => console.log('Opening path', path),

      // print
      // eslint-disable-next-line no-console
      printPage: (options = {}) => console.log('Printing page', options),
    }}
  >
    {children}
  </ElectronContext.Provider>
);
