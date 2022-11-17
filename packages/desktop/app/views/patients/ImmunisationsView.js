import React, { useState } from 'react';
import {
  TopBar,
  PageContainer,
  DataFetchingTable,
  PatientSearchBar,
  ContentPane,
} from '../../components';
import {
  displayId,
  firstName,
  lastName,
  culturalName,
  village,
  sex,
  dateOfBirth,
  vaccinationStatus,
} from './columns';
import { PatientImmunisationsModal } from './components';
import { usePatientSearch } from '../../contexts/PatientSearch';

const COLUMNS = [
  displayId,
  firstName,
  lastName,
  culturalName,
  village,
  sex,
  dateOfBirth,
  vaccinationStatus,
];

const PatientImmunisationsTable = React.memo(({ onPatientSelect, ...props }) => (
  <DataFetchingTable
    endpoint="patient"
    columns={COLUMNS}
    noDataMessage="No patients found"
    onRowClick={onPatientSelect}
    {...props}
  />
));

export const ImmunisationsView = () => {
  const { searchParameters, setSearchParameters } = usePatientSearch('ImmunisationsView');
  const [modalOpen, setModalOpen] = useState(false);
  const [patient, setPatient] = useState({});
  const onRowClick = row => {
    setPatient(row);
    setModalOpen(true);
  };

  return (
    <PageContainer>
      <PatientImmunisationsModal
        maxWidth="lg"
        fullWidth={false}
        open={modalOpen}
        patient={patient}
        onClose={() => setModalOpen(false)}
      />
      <TopBar title="Immunisation register" />
      <PatientSearchBar
        onSearch={setSearchParameters}
        searchParameters={searchParameters}
        suggestByFacility={false}
      />
      <ContentPane>
        <PatientImmunisationsTable onPatientSelect={onRowClick} fetchOptions={searchParameters} />
      </ContentPane>
    </PageContainer>
  );
};
