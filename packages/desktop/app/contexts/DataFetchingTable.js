import React, { useState, useContext } from 'react';

const DataFetchingTableContext = React.createContext({
  tables: {},
});

export const useFetchingTableRefresh = () => useContext(DataFetchingTableContext);

export const DataFetchingTableProvider = ({ children }) => {
  // Tables will be differentiated by having their endpoint as keys
  const [tables, setTables] = useState({});

  // Helper function to force a refresh on a DataFetchingTable component.
  const refresh = tableContextId => {
    setTables(prevTables => {
      // Table counts will be either undefined or a number.
      const currentTableCount = prevTables[tableContextId] || 0;
      // Use modulo to avoid max integer default (unlikely but doesn't hurt)
      const newTableCount = (currentTableCount + 1) % 100;
      return { ...prevTables, [tableContextId]: newTableCount };
    });
  };

  return (
    <DataFetchingTableContext.Provider
      value={{
        tables,
        refresh,
      }}
    >
      {children}
    </DataFetchingTableContext.Provider>
  );
};
