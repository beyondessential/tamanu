import React, { useContext, createContext, useState } from 'react';

const ImagingRequestsContext = createContext({});

export const useImagingRequests = () => useContext(ImagingRequestsContext);

export const ImagingRequestsProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <ImagingRequestsContext.Provider
      value={{
        searchParameters,
        setSearchParameters,
      }}
    >
      {children}
    </ImagingRequestsContext.Provider>
  );
};
