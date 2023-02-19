import React, { useContext, createContext, useState } from 'react';
import { useApi } from '../api';

const testData = {
  id: '28d7c9ff-4b2e-4852-8ade-2a0eec6fd635',
  sampleTime: '2023-02-16 15:37:45',
  requestedDate: '2023-02-16 15:37:45',
  specimenAttached: false,
  urgent: false,
  status: 'reception_pending',
  displayId: '9H3U375',
  updatedAtSyncTick: '407803',
  createdAt: '2023-02-16T02:37:56.244Z',
  updatedAt: '2023-02-16T02:37:56.244Z',
  encounterId: '0304e900-26bb-47f5-86ae-2e933d8db7b0',
  requestedById: '1SYEd1SeabMJ5ibw',
  labTestCategoryId: 'labTestCategory-COVID',
  tests: [
    {
      id: '23c39d5b-ac2c-4eca-a36b-b91d66f1e0f2',
      date: '2023-02-16',
      status: 'reception_pending',
      result: 'Positive',
      updatedAtSyncTick: '407809',
      createdAt: '2023-02-16T02:37:56.248Z',
      updatedAt: '2023-02-16T02:38:03.460Z',
      labRequestId: '28d7c9ff-4b2e-4852-8ade-2a0eec6fd635',
      labTestTypeId: 'labTestType-RDTPositive',
      labTestType: {
        id: 'labTestType-RDTPositive',
        code: 'RDT Positive',
        name: 'AgRDT Positive',
        unit: '',
        maleMin: null,
        maleMax: null,
        femaleMin: null,
        femaleMax: null,
        rangeText: null,
        resultType: 'Number',
        options: 'Positive',
        visibilityStatus: 'current',
        updatedAtSyncTick: '0',
        createdAt: '2023-01-12T21:02:25.884Z',
        updatedAt: '2023-01-12T21:02:25.884Z',
        labTestCategoryId: 'labTestCategory-COVID',
      },
    },
  ],
  requestedBy: {
    id: '1SYEd1SeabMJ5ibw',
    email: 'tbastien@beyondessential.com.au',
    displayName: 'Alan Smith',
    role: 'practitioner',
    updatedAtSyncTick: '0',
    createdAt: '2023-01-12T21:02:25.686Z',
    updatedAt: '2023-01-12T21:02:25.686Z',
  },
  category: {
    id: 'labTestCategory-COVID',
    code: 'COVID',
    type: 'labTestCategory',
    name: 'COVID-19 Swab',
    visibilityStatus: 'current',
    updatedAtSyncTick: '0',
    createdAt: '2023-01-12T21:02:22.224Z',
    updatedAt: '2023-01-12T21:02:22.224Z',
  },
};

const LabRequestContext = createContext({
  labRequest: {},
  isLoading: false,
});

export const useLabRequest = () => useContext(LabRequestContext);

export const LabRequestProvider = ({ children }) => {
  const [labRequest, setLabRequest] = useState(testData);
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
