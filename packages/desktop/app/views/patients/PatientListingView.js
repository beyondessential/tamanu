import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, DataFetchingTable } from '../../components';
import { DropdownButton } from '../../components/DropdownButton';
import { PatientSearchBar, NewPatientModal } from './components';

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

const PatientTable = React.memo(({ onViewPatient, showInpatientDetails, ...props }) => {
  const columns = showInpatientDetails ? INPATIENT_COLUMNS : LISTING_COLUMNS;
  return (
    <StyledDataTable
      columns={columns}
      noDataMessage="No patients found"
      onRowClick={row => onViewPatient(row.id)}
      rowStyle={({ patientStatus }) =>
        patientStatus === 'deceased' ? '& > td:not(:first-child) { color: #ed333a; }' : ''
      }
      {...props}
    />
  );
});

const NewPatientButton = React.memo(({ onCreateNewPatient }) => {
  const [isCreatingPatient, setCreatingPatient] = useState(false);
  const [isBirth, setIsBirth] = useState(false);
  const hideModal = useCallback(() => setCreatingPatient(false), [setCreatingPatient]);

  const showNewPatient = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(false);
  }, []);

  const showNewBirth = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(true);
  }, []);

  const onCreate = useCallback(
    newPatient => {
      setCreatingPatient(false);
      onCreateNewPatient(newPatient.id);
    },
    [onCreateNewPatient],
  );

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
        onCreateNewPatient={onCreate}
      />
    </>
  );
});

const selectPatientConnector = connect(null, dispatch => ({
  onViewPatient: id => dispatch(viewPatient(id)),
}));

export const DumbPatientListingView = ({ onViewPatient }) => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <NewPatientButton onCreateNewPatient={onViewPatient} />
      </TopBar>
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable
        endpoint={PATIENT_SEARCH_ENDPOINT}
        fetchOptions={searchParameters}
        onViewPatient={onViewPatient}
      />
    </PageContainer>
  );
};

export const PatientListingView = selectPatientConnector(DumbPatientListingView);

export const AdmittedPatientsView = selectPatientConnector(
  React.memo(({ onViewPatient }) => (
    <PageContainer>
      <TopBar title="Admitted patient listing" />
      <PatientTable
        fetchOptions={{ inpatient: 1 }}
        onViewPatient={onViewPatient}
        endpoint={PATIENT_SEARCH_ENDPOINT}
        showInpatientDetails
      />
    </PageContainer>
  )),
);

export const OutpatientsView = selectPatientConnector(
  React.memo(({ onViewPatient }) => (
    <PageContainer>
      <TopBar title="Outpatient listing" />
      <PatientTable
        fetchOptions={{ outpatient: 1 }}
        onViewPatient={onViewPatient}
        endpoint={PATIENT_SEARCH_ENDPOINT}
        showInpatientDetails
      />
    </PageContainer>
  )),
);
