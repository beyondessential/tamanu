import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { reloadPatient } from '../../store/patient';

import {
  TopBar,
  PageContainer,
  DataFetchingTable,
  AllPatientsSearchBar,
  PatientSearchBar,
  ContentPane,
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

const StyledTopBar = styled(TopBar)`
  position: sticky;
  top: 0;
  z-index: 9;
`;

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

const PatientTable = ({ columns, fetchOptions, searchParameters }) => {
  const { navigateToPatient } = usePatientNavigation();
  const dispatch = useDispatch();
  const fetchOptionsWithSearchParameters = { ...searchParameters, ...fetchOptions };

  const handleViewPatient = async row => {
    await dispatch(reloadPatient(row.id));
    navigateToPatient(row.id);
  };

  return (
    <DataFetchingTable
      columns={columns}
      noDataMessage="No patients found"
      onRowClick={handleViewPatient}
      rowStyle={({ patientStatus }) =>
        patientStatus === 'deceased' ? '& > td:not(:first-child) { color: #ed333a; }' : ''
      }
      fetchOptions={fetchOptionsWithSearchParameters}
      endpoint={PATIENT_SEARCH_ENDPOINT}
    />
  );
};

const NewPatientButton = ({ onCreateNewPatient }) => {
  const { navigateToPatient } = usePatientNavigation();
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

  const handleCreateNewPatient = async newPatient => {
    setCreatingPatient(false);
    if (onCreateNewPatient) {
      onCreateNewPatient(newPatient.id);
    } else {
      await dispatch(reloadPatient(newPatient.id));
    }
    navigateToPatient(newPatient.id);
  };

  return (
    <>
      <DropdownButton
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
        onCreateNewPatient={handleCreateNewPatient}
      />
    </>
  );
};

export const PatientListingView = ({ onViewPatient }) => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <PageContainer>
      <StyledTopBar title="Patient listing">
        <NewPatientButton onCreateNewPatient={onViewPatient} />
      </StyledTopBar>
      <AllPatientsSearchBar onSearch={setSearchParameters} />
      <ContentPane>
        <PatientTable
          onViewPatient={onViewPatient}
          searchParameters={searchParameters}
          columns={LISTING_COLUMNS}
        />
      </ContentPane>
    </PageContainer>
  );
};

export const AdmittedPatientsView = () => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <PageContainer>
      <StyledTopBar title="Admitted patient listing" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <ContentPane>
        <PatientTable
          fetchOptions={{ inpatient: 1 }}
          searchParameters={searchParameters}
          columns={INPATIENT_COLUMNS}
        />
      </ContentPane>
    </PageContainer>
  );
};

export const OutpatientsView = () => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <PageContainer>
      <StyledTopBar title="Outpatient listing" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <ContentPane>
        <PatientTable
          fetchOptions={{ outpatient: 1 }}
          searchParameters={searchParameters}
          columns={INPATIENT_COLUMNS}
        />
      </ContentPane>
    </PageContainer>
  );
};
