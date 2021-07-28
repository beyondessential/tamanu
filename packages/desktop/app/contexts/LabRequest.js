import React, { useContext, createContext, useState } from 'react';
import { push } from 'connected-react-router';

import { ApiContext } from '../api/singletons';

const LabRequestContext = createContext({
  labRequest: {},
  isLoading: false,
});

export const useLabRequest = () => useContext(LabRequestContext);

export const LabRequestProvider = ({ store, children }) => {
  const [labRequest, setLabRequest] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const api = useContext(ApiContext);

  const viewLabRequest = () => {
    store.dispatch(push('/patients/encounter/labRequest'));
  };

  const loadLabRequest = async labRequestId => {
    setIsLoading(true);
    const data = await api.get(`labRequest/${labRequestId}`);
    setLabRequest({ ...data });
    viewLabRequest();
    window.labRequest = labRequest;
    setIsLoading(false);
  };

  const updateLabRequest = async (labRequestId, data) => {
    await api.put(`labRequest/${labRequestId}`, data);
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
        viewLabRequest,
        updateLabRequest,
        updateLabTest,
      }}
    >
      {children}
    </LabRequestContext.Provider>
  );
};
