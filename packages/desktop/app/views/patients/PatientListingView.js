import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { viewPatient } from '../../store/patient';
import {
  TopBar,
  PageContainer,
  DataFetchingTable,
  AllPatientsSearchBar,
  PatientSearchBar,
} from '../../components';
import { DropdownButton } from '../../components/DropdownButton';
import { NewPatientModal } from './components';
import {
  markedForSync,
  displayId,
  firstName,
  lastName,
  culturalName,
  village,
  sex,
  dateOfBirth,
  status,
  location,
  department,
} from './columns';

const PATIENT_SEARCH_ENDPOINT = 'patient';

const LISTING_COLUMNS = [
  markedForSync,
  displayId,
  firstName,
  lastName,
  culturalName,
  village,
  sex,
  dateOfBirth,
  status,
];

const INPATIENT_COLUMNS = [markedForSync, displayId, firstName, lastName, sex, dateOfBirth]
  .map(column => ({
    ...column,
    sortable: false,
  }))
  // the above columns are not sortable due to backend query
  // https://github.com/beyondessential/tamanu/pull/2029#issuecomment-1090981599
  // location and department should be sortable
  .concat([location, department]);

const StyledDataTable = styled(DataFetchingTable)`
  margin: 24px;
`;

const PatientTable = ({ onViewPatient, columns, fetchOptions, searchParameters, category }) => {
  const dispatch = useDispatch();
  const fetchOptionsWithSearchParameters = { ...searchParameters, ...fetchOptions };
  return (
    <StyledDataTable
      columns={columns}
      noDataMessage="No patients found"
      onRowClick={row => {
        if (onViewPatient) {
          onViewPatient(row.id, category);
        } else {
          dispatch(viewPatient(row.id, category));
        }
      }}
      rowStyle={({ patientStatus }) =>
        patientStatus === 'deceased' ? '& > td:not(:first-child) { color: #ed333a; }' : ''
      }
      fetchOptions={fetchOptionsWithSearchParameters}
      endpoint={PATIENT_SEARCH_ENDPOINT}
    />
  );
};

const NewPatientButton = ({ onCreateNewPatient }) => {
  const params = useParams();
  const [isCreatingPatient, setCreatingPatient] = useState(false);
  const [isBirth, setIsBirth] = useState(false);
  const dispatch = useDispatch();
  const hideModal = useCallback(() => setCreatingPatient(false), [setCreatingPatient]);

  const showNewPatient = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(false);
  }, []);

  const showNewBirth = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(true);
  }, []);

  return (
    <>
      <DropdownButton
        color="primary"
        actions={[
          { label: 'Create new patient', onClick: showNewPatient },
          { label: 'Register birth', onClick: showNewBirth },
        ]}
      />
      <NewPatientModal
        title="New patient"
        isBirth={isBirth}
        open={isCreatingPatient}
        onCancel={hideModal}
        onCreateNewPatient={newPatient => {
          setCreatingPatient(false);
          if (onCreateNewPatient) {
            onCreateNewPatient(newPatient.id, params.category);
          } else {
            dispatch(viewPatient(newPatient.id, params.category));
          }
        }}
      />
    </>
  );
};

export const PatientListingView = ({ onViewPatient }) => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <NewPatientButton onCreateNewPatient={onViewPatient} />
      </TopBar>
      <AllPatientsSearchBar onSearch={setSearchParameters} />
      <PatientTable
        category="all"
        onViewPatient={onViewPatient}
        searchParameters={searchParameters}
        columns={LISTING_COLUMNS}
      />
    </PageContainer>
  );
};

export const AdmittedPatientsView = () => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <PageContainer>
      <TopBar title="Admitted patient listing" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable
        category="inpatient"
        fetchOptions={{ inpatient: 1 }}
        searchParameters={searchParameters}
        columns={INPATIENT_COLUMNS}
      />
    </PageContainer>
  );
};

export const OutpatientsView = () => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <PageContainer>
      <TopBar title="Outpatient listing" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable
        category="outpatient"
        fetchOptions={{ outpatient: 1 }}
        searchParameters={searchParameters}
        columns={INPATIENT_COLUMNS}
      />
    </PageContainer>
  );
};
