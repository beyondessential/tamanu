import React, { useContext, createContext, useState } from 'react';
import { push } from 'connected-react-router';
import { useApi } from '../api';

const LabRequestContext = createContext({
  labRequest: {},
  isLoading: false,
});

export const useLabRequest = () => useContext(LabRequestContext);

export const LabRequestProvider = ({ store, children }) => {
  const [labRequest, setLabRequest] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchParameters, setSearchParameters] = useState({});

  const api = useApi();

  const viewLabRequest = (patientId, encounterId, labRequestId, modal, category) => {
    store.dispatch(
      push(
        `/patients/${category}/${patientId}/encounter/${encounterId}/lab-request/${labRequestId}/${modal}`,
      ),
    );
  };

  const loadLabRequest = async (
    patientId,
    encounterId,
    labRequestId,
    modal = '',
    category = 'all',
  ) => {
    setIsLoading(true);
    const data = await api.get(`labRequest/${labRequestId}`);
    setLabRequest({ ...data });
    viewLabRequest(patientId, encounterId, labRequestId, modal, category);
    window.labRequest = labRequest;
    setIsLoading(false);
  };

  const updateLabRequest = async (patientId, encounterId, labRequestId, data, category) => {
    const update = { ...data };
    if (data.status) {
      update.userId = api.user.id;
    }
    await api.put(`labRequest/${labRequestId}`, update);
    await loadLabRequest(patientId, encounterId, labRequestId, '', category);
  };

  const updateLabTest = async (patientId, encounterId, labRequestId, labTestId, data, category) => {
    await api.put(`labTest/${labTestId}`, data);
    await loadLabRequest(patientId, encounterId, labRequestId, '', category);
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
        searchParameters,
        setSearchParameters,
      }}
    >
      {children}
    </LabRequestContext.Provider>
  );
};
