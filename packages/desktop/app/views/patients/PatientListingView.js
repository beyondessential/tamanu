import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { viewPatient } from '../../store/patient';
import { TopBar, PageContainer, Button, DataFetchingTable } from '../../components';
import { PatientSearchBar, NewPatientModal } from './components';
import { displayId, firstName, lastName, culturalName, sex, dateOfBirth } from './columns';
import { PATIENT_SEARCH_ENDPOINT } from './constants';
import { DropdownButton } from '../../components/DropdownButton';

const DumbPatientActions = React.memo(({ onView, onAdmit, onTriage }) => (
  <DropdownButton
    actions={[
      { label: "View", onClick: onView },
      { label: "Admit", onClick: onAdmit },
      { label: "Triage", onClick: onTriage },
    ]}
  />
));

const PatientActions = connect(
  null,
  (dispatch, { patient }) => ({
    onView: () => dispatch(viewPatient(patient._id)),
    onAdmit: () => dispatch(viewPatient(patient._id)),
    onTriage: () => dispatch(viewPatient(patient._id)),
  })
)(DumbPatientActions);

const COLUMNS = [
  displayId,
  firstName,
  lastName,
  culturalName,
  sex,
  dateOfBirth,
  {
    key: 'actions',
    title: 'Actions',
    accessor: (row) => <PatientActions patient={row} />,
  },
];

const PatientTable = React.memo(({ ...props }) => (
  <DataFetchingTable
    endpoint={PATIENT_SEARCH_ENDPOINT}
    columns={COLUMNS}
    noDataMessage="No patients found"
    {...props}
  />
));

export const PatientListingView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});
  const [creatingPatient, setCreatingPatient] = useState(false);

  const toggleCreatingPatient = useCallback(() => {
    setCreatingPatient(!creatingPatient);
  }, [creatingPatient]);

  return (
    <PageContainer>
      <TopBar title="Patient listing">
        <Button color="primary" variant="outlined" onClick={toggleCreatingPatient}>
          Create new patient
        </Button>
      </TopBar>
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable fetchOptions={searchParameters} />
      <NewPatientModal
        title="New patient"
        open={creatingPatient}
        onCancel={toggleCreatingPatient}
      />
    </PageContainer>
  );
});

export const AdmittedPatientsView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  const fullParameters = {
    'visits.endDate': null,
    ...searchParameters,
  };

  return (
    <PageContainer>
      <TopBar title="Admitted patient listing" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientTable fetchOptions={fullParameters} />
    </PageContainer>
  );
});
