import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import { pick } from 'lodash';
import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, DataFetchingTable } from '../../components';
import { DropdownButton } from '../../components/DropdownButton';
import { PatientSearchBar, NewPatientModal } from './components';
import { getColumns } from './columns';
import { connectFlags } from '../../flags';

const PATIENT_SEARCH_ENDPOINT = 'patient';

const BASE_COLUMN_NAMES = ['markedForSync', 'displayId', 'firstName', 'lastName', 'culturalName', 'village', 'sex', 'dateOfBirth'];

const LISTING_COLUMN_NAMES = [...BASE_COLUMN_NAMES, 'status'];
const INPATIENT_COLUMN_NAMES = [...BASE_COLUMN_NAMES, 'location', 'department'];

const StyledDataTable = styled(DataFetchingTable)`
  margin: 24px;
`;

const DumbPatientTable = React.memo(({ onViewPatient, showInpatientDetails, getFlag, ...props }) => {
  const isSortable = showInpatientDetails;
  const columnNames = showInpatientDetails ? INPATIENT_COLUMN_NAMES : LISTING_COLUMN_NAMES;
  let columns = getColumns(getFlag, columnNames);
  if (isSortable) {
    columns = columns.map(column => ({
      ...column,
      sortable: false,
    }));
  }
  return (
    <StyledDataTable
      columns={columns}
      noDataMessage="No patients found"
      onRowClick={row => onViewPatient(row.id)}
      {...props}
    />
  );
});

const PatientTable = connectFlags(DumbPatientTable);

const NewPatientButton = React.memo(({ onCreateNewPatient }) => {
  const [isCreatingPatient, setCreatingPatient] = useState(false);
  const [isBirth, setIsBirth] = useState(false);
  const hideModal = useCallback(() => setCreatingPatient(false), [setCreatingPatient]);

  const showNewPatient = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(false);
  }, [setCreatingPatient, setIsBirth]);

  const showNewBirth = useCallback(() => {
    setCreatingPatient(true);
    setIsBirth(true);
  }, [setCreatingPatient, setIsBirth]);

  const onCreate = useCallback(newPatient => {
    setCreatingPatient(false);
    onCreateNewPatient(newPatient.id);
  });

  return (
    <React.Fragment>
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
    </React.Fragment>
  );
});

const selectPatientConnector = connect(null, dispatch => ({
  onViewPatient: id => dispatch(viewPatient(id)),
}));

export const DumbPatientListingView = React.memo(({ onViewPatient }) => {
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
});

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
