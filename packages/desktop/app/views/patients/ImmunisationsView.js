import React, { useState } from 'react';

import { useFlags } from '../../contexts/FeatureFlags';
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
      <PatientImmunisationsTable onPatientSelect={onRowClick} fetchOptions={searchParameters} />
    </PageContainer>
  );
};
