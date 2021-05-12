import React, { useEffect, useState } from 'react';
import { pick } from 'lodash';

import { API } from '../../api';
import { useFlags } from '../../contexts/FeatureFlags';
import { TopBar, PageContainer, DataFetchingTable } from '../../components';
import { getColumns } from './columns';
import { ImmunisationSearchBar, PatientImmunisationsModal } from './components';

const CovidVaccinationStatusComponent = ({ row }) => {
  const [covidVaccinationStatus, setCovidVaccinationStatus] = useState('No dose');

  useEffect(() => {
    const getVaccinations = async () => {
      const { data: patientVaccinations } = await API.get(`patient/${row.id}/administeredVaccines`);
      const covidVaccinations = patientVaccinations.filter(
        v => v.scheduledVaccine?.label === 'COVAX',
      );

      if (covidVaccinations.length === 1) {
        setCovidVaccinationStatus('1 Dose');
      }
      if (covidVaccinations.length >= 2) {
        setCovidVaccinationStatus('Complete');
      }
    };
    getVaccinations();
  }, []);

  return covidVaccinationStatus;
};

export const covidVaccinationStatus = {
  key: 'vaccinationStatus',
  title: 'Vaccination Status',
  minWidth: 100,
  accessor: row => <CovidVaccinationStatusComponent row={row} />,
  asyncExportAccessor: async row => {
    const patientVaccinations = await API.get(`patient/${row.id}/administeredVaccines`);
    const covidVaccinations = patientVaccinations.data.filter(
      v => v.scheduledVaccine?.label === 'COVAX',
    );
    if (covidVaccinations.length === 1) return '1 Dose';
    if (covidVaccinations.length >= 2) return 'Complete';
    return 'No dose';
  },
};

const COLUMN_NAMES = ['displayId', 'firstName', 'lastName', 'village', 'covidVaccinationStatus'];

const PatientCovidCampaignTable = React.memo(({ onPatientSelect, getVaccines, ...props }) => {
  const { getFlag } = useFlags();
  return (
    <DataFetchingTable
      endpoint="patient"
      columns={getColumns(getFlag, COLUMN_NAMES)}
      noDataMessage="No patients found"
      exportName="Covid Campaign"
      onRowClick={onPatientSelect}
      {...props}
    />
  );
});

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
