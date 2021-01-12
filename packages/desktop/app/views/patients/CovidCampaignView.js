import React, { useEffect, useState } from 'react';
import { API } from '../../api';

import { TopBar, PageContainer, DataFetchingTable } from '../../components';
import { displayId, firstName, lastName, village } from './columns';
import { ImmunisationSearchBar, PatientImmunisationsModal } from './components';

const VaccineStatusComponent = ({ row }) => {
  const [vaccinations, setVaccinations] = useState([]);

  const getVaccinations = async () => {
    const patientVaccinations = await API.get(`patient/${row.id}/immunisations`);
    setVaccinations(patientVaccinations.data);
  };

  useEffect(() => {
    getVaccinations();
  }, []);

  const covidVaccinations = vaccinations.filter(v => v.schedule === 'Campaign');
  if (covidVaccinations.length === 1) return '1 Dose';
  if (covidVaccinations.length === 2) return 'Complete';
  return 'No dose';
};

export const covidVaccinationStatus = {
  key: 'vaccinationStatus',
  title: 'Vaccination Status',
  minWidth: 100,
  accessor: row => <VaccineStatusComponent row={row} />,
  asyncExportAccessor: async row => {
    const patientVaccinations = await API.get(`patient/${row.id}/immunisations`);
    const covidVaccinations = patientVaccinations.data.filter(v => v.schedule === 'Campaign');
    if (covidVaccinations.length === 1) return '1 Dose';
    if (covidVaccinations.length === 2) return 'Complete';
    return 'No dose';
  },
};

const COLUMNS = [displayId, firstName, lastName, village, covidVaccinationStatus];

const PatientCovidCampaignTable = React.memo(({ onPatientSelect, getVaccines, ...props }) => (
  <DataFetchingTable
    endpoint="patient"
    columns={COLUMNS}
    noDataMessage="No patients found"
    onRowClick={onPatientSelect}
    {...props}
  />
));

export const CovidCampaignView = React.memo(({ getPatientVaccinations }) => {
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
      <TopBar title="COVID Campaign" />
      <ImmunisationSearchBar onSearch={setSearchParameters} />
      <PatientCovidCampaignTable
        getVaccines={getPatientVaccinations}
        onPatientSelect={onRowClick}
        fetchOptions={searchParameters}
      />
    </PageContainer>
  );
});

