import React, { useContext, createContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../api';

const ImagingRequestsContext = createContext({});

export const useImagingRequests = () => useContext(ImagingRequestsContext);

export const ImagingRequestsProvider = ({ children }) => {
  const [searchParameters, setSearchParameters] = useState({});
  const api = useApi();

  const { data: imagingRequestAreas = {} } = useQuery(['imagingRequestAreas'], () =>
    api.get('imagingRequest/areas'),
  );

  const getAreasForImagingType = type => {
    return imagingRequestAreas[type] || [];
  };

  return (
    <ImagingRequestsContext.Provider
      value={{
        searchParameters,
        setSearchParameters,
        getAreasForImagingType,
      }}
    >
      {children}
    </ImagingRequestsContext.Provider>
  );
};
