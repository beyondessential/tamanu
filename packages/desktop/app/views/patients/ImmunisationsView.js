import React, { useState } from 'react';

import { TopBar, PageContainer, DataFetchingTable } from '../../components';
import { connectFlags } from '../../flags';
import { getColumns } from './columns';
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

const COLUMN_NAMES = [
  'displayId',
  'firstName',
  'lastName',
  'culturalName',
  'village',
  'sex',
  'dateOfBirth',
  'vaccinationStatus',
];

const DumbPatientImmunisationsTable = React.memo(({ getFlag, onPatientSelect, ...props }) => (
  <DataFetchingTable
    endpoint="patient"
    columns={getColumns(getFlag, COLUMN_NAMES)}
    noDataMessage="No patients found"
    onRowClick={onPatientSelect}
    {...props}
  />
));

const PatientImmunisationsTable = connectFlags(DumbPatientImmunisationsTable);

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
      <PatientImmunisationsTable onPatientSelect={onRowClick} fetchOptions={searchParameters} />
    </PageContainer>
  );
});
