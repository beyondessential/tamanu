import React, { useContext, createContext, useState } from 'react';
import { useApi } from '../api';

const LabRequestContext = createContext({
  labRequest: {},
  isLoading: false,
});

export const useLabRequest = () => useContext(LabRequestContext);

export const LabRequestProvider = ({ children }) => {
  const [labRequest, setLabRequest] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});

  const api = useApi();

  const loadLabRequest = async labRequestId => {
    setIsLoading(true);
    const data = await api.get(`labRequest/${labRequestId}`);
    setLabRequest({ ...data });
    window.labRequest = labRequest;
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
