import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { LAB_REQUEST_STATUSES, USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { useDateTimeIfAvailable } from '@tamanu/ui-components';
import { useApi } from '../api';
import { useUserPreferencesQuery } from '../api/queries';
import { useUserPreferencesMutation } from '../api/mutations';
import { useAuth } from './Auth';

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
    (value) => {
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
  const { getCurrentDateTime } = (useDateTimeIfAvailable() || {})
  const { facilityId } = useAuth();
  const [labRequest, setLabRequest] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchParameters, setSearchParameters] = useState({
    [LabRequestSearchParamKeys.All]: {},
    [LabRequestSearchParamKeys.Published]: {},
    [LabRequestSearchParamKeys.Other]: {},
  });
  const hasLoadedPreferences = useRef(false);

  const { data: userPreferences } = useUserPreferencesQuery();
  const { mutate: mutateUserPreferences } = useUserPreferencesMutation(facilityId);

  const api = useApi();

  useEffect(() => {
    if (userPreferences && !hasLoadedPreferences.current) {
      if (userPreferences.labRequestSearchParameters) {
        setSearchParameters(userPreferences.labRequestSearchParameters);
      }
      hasLoadedPreferences.current = true;
    }
  }, [userPreferences]);

  const setSearchParametersWithPersist = useCallback(
    (newSearchParameters) => {
      setSearchParameters(newSearchParameters);
      mutateUserPreferences({
        key: USER_PREFERENCES_KEYS.LAB_REQUEST_SEARCH_PARAMETERS,
        value: newSearchParameters,
      });
    },
    [mutateUserPreferences],
  );

  const loadLabRequest = useCallback(
    async (labRequestId) => {
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
      update.publishedDate = getCurrentDateTime();
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
        setSearchParameters: setSearchParametersWithPersist,
      }}
    >
      {children}
    </LabRequestContext.Provider>
  );
};
