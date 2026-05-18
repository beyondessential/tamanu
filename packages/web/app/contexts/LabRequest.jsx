import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { debounce } from 'lodash';
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
  const [labRequest, setLabRequest] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchParameters, setSearchParameters] = useState({
    [LabRequestSearchParamKeys.All]: {},
    [LabRequestSearchParamKeys.Published]: {},
    [LabRequestSearchParamKeys.Other]: {},
  });
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);

  const api = useApi();
  const { facilityId } = useAuth();
  const { data: userPreferences, isLoading: prefsLoading } = useUserPreferencesQuery();
  const { mutate } = useUserPreferencesMutation(facilityId);

  useEffect(() => {
    if (prefsLoading || hasLoadedPreferences) return;
    setHasLoadedPreferences(true);
    if (userPreferences?.labRequestSearchParameters) {
      setSearchParameters(prev => ({ ...prev, ...userPreferences.labRequestSearchParameters }));
    }
  }, [prefsLoading, hasLoadedPreferences, userPreferences]);

  const debouncedSave = useMemo(
    () =>
      debounce(
        params => mutate({ key: USER_PREFERENCES_KEYS.LAB_REQUEST_SEARCH_PARAMETERS, value: params }),
        300,
      ),
    [mutate],
  );

  useEffect(() => {
    if (!hasLoadedPreferences) return;
    debouncedSave(searchParameters);
  }, [searchParameters, hasLoadedPreferences, debouncedSave]);

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
        setSearchParameters,
      }}
    >
      {children}
    </LabRequestContext.Provider>
  );
};
