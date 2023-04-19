import React, { useContext, createContext, useState, useCallback, useEffect } from 'react';
import { useApi } from '../api';

const LabRequestContext = createContext({
  labRequest: {},
  isLoading: false,
});

export const LabRequestKeys = {
  All: 'LabRequestListingView',
  Published: 'PublishedLabRequestsListingView',
};

export const useLabRequest = (key = 'General') => {
  const {
    searchParameters: allSearchParameters,
    setSearchParameters: setAllSearchParameters,
    ...otherProps
  } = useContext(LabRequestContext);

  const searchParameters = allSearchParameters[key];
  const setSearchParameters = useCallback(
    value => {
      setAllSearchParameters({
        ...allSearchParameters,
        [key]: value,
      });
    },
    [key, allSearchParameters, setAllSearchParameters],
  );

  useEffect(() => {
    if (!searchParameters) {
      setSearchParameters({});
    }
  }, [searchParameters, setSearchParameters]);
  return { searchParameters: searchParameters || {}, setSearchParameters, ...otherProps };
};

export const LabRequestProvider = ({ children }) => {
  const [labRequest, setLabRequest] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});

  const api = useApi();

  const loadLabRequest = async labRequestId => {
    setIsLoading(true);
    const data = await api.get(`labRequest/${labRequestId}`);
    setLabRequest({ ...data });
    setIsLoading(false);
  };

  const updateLabRequest = async (labRequestId, data) => {
    const update = { ...data };
    if (data.status) {
      update.userId = api.user.id;
    }
    await api.put(`labRequest/${labRequestId}`, update);
    await loadLabRequest(labRequestId);
  };

  const updateLabTest = async (labRequestId, labTestId, data) => {
    await api.put(`labTest/${labTestId}`, data);
    await loadLabRequest(labRequestId);
  };

  return (
    <LabRequestContext.Provider
      value={{
        labRequest,
        isLoading,
        loadLabRequest,
        updateLabRequest,
        updateLabTest,
        searchParameters,
        setSearchParameters,
      }}
    >
      {children}
    </LabRequestContext.Provider>
  );
};
