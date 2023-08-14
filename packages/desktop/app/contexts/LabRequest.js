import React, { useContext, createContext, useState, useCallback } from 'react';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useApi } from '../api';

const LabRequestContext = createContext({
  labRequest: {},
  isLoading: false,
});

export const LabRequestSearchParamKeys = {
  All: 'LabRequestListingView',
  Published: 'PublishedLabRequestsListingView',
  Other: 'OtherView',
};

export const useLabRequest = (key = LabRequestSearchParamKeys.Other) => {
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

  return { searchParameters, setSearchParameters, ...otherProps };
};

export const LabRequestProvider = ({ children }) => {
  const [labRequest, setLabRequest] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchParameters, setSearchParameters] = useState({
    [LabRequestSearchParamKeys.All]: {},
    [LabRequestSearchParamKeys.Published]: {},
    [LabRequestSearchParamKeys.Other]: {},
  });

  const api = useApi();

  const loadLabRequest = useCallback(
    async labRequestId => {
      setIsLoading(true);
      const data = await api.get(`labRequest/${labRequestId}`);
      setLabRequest({ ...data });
      setIsLoading(false);
    },
    [api],
  );

  const updateLabRequest = async (labRequestId, data) => {
    const update = { ...data };
    if (data.status) {
      update.userId = api.user.id;
    }
    if (data.status === LAB_REQUEST_STATUSES.PUBLISHED) {
      update.publishedDate = getCurrentDateTimeString();
    }

    await api.put(`labRequest/${labRequestId}`, update);
    await loadLabRequest(labRequestId);
  };

  return (
    <LabRequestContext.Provider
      value={{
        labRequest,
        isLoading,
        loadLabRequest,
        updateLabRequest,
        searchParameters,
        setSearchParameters,
      }}
    >
      {children}
    </LabRequestContext.Provider>
  );
};
