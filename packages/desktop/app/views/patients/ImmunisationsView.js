import React, { useState } from 'react';

import { TopBar, PageContainer, DataFetchingTable } from '../../components';
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
import { PatientSearchBar, PatientImmunisationsModal } from './components';

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

const PatientImmunisationsTable = React.memo(({ displayImmunisationHistory, ...props }) => (
  <DataFetchingTable
    endpoint="patient"
    columns={COLUMNS}
    noDataMessage="No patients found"
    onRowClick={row => displayImmunisationHistory(row)}
    {...props}
  />
));

export const ImmunisationsView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});
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
      <TopBar title="Immunisation Register" />
      <PatientSearchBar onSearch={setSearchParameters} />
      <PatientImmunisationsTable
        displayImmunisationHistory={onRowClick}
        fetchOptions={searchParameters}
      />
    </PageContainer>
  );
});
