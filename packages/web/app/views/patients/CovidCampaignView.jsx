import React, { useEffect, useState } from 'react';
import { API } from '../../api/singletons';
import { useApi } from '../../api';
import {
  ContentPane,
  DataFetchingTable,
  ImmunisationSearchBar,
  PageContainer,
  TopBar,
} from '../../components';
import { displayId, firstName, lastName, village } from './columns';
import { PatientImmunisationsModal } from './components';

const CovidVaccinationStatusComponent = ({ row }) => {
  const [covidVaccinationStatus, setCovidVaccinationStatus] = useState('No dose');
  const api = useApi();

  useEffect(() => {
    const getVaccinations = async () => {
      const { data: patientVaccinations } = await api.get(`patient/${row.id}/administeredVaccines`);
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
  }, [api, row.id]);

  return covidVaccinationStatus;
};

export const covidVaccinationStatus = {
  key: 'vaccinationStatus',
  title: 'Vaccination status',
  minWidth: 100,
  accessor: row => <CovidVaccinationStatusComponent row={row} data-testid='covidvaccinationstatuscomponent-wr44' />,
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

const COLUMNS = [displayId, firstName, lastName, village, covidVaccinationStatus];

const PatientCovidCampaignTable = React.memo(({ onPatientSelect, ...props }) => {
  delete props.getVaccines;
  return (
    <DataFetchingTable
      endpoint="patient"
      columns={COLUMNS}
      noDataMessage="No patients found"
      exportName="Covid Campaign"
      onRowClick={onPatientSelect}
      {...props}
      data-testid='datafetchingtable-4c9l' />
  );
});

export const CovidCampaignView = ({ getPatientVaccinations }) => {
  const [searchParameters, setSearchParameters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [patient, setPatient] = useState({});
  const onRowClick = row => {
    setPatient(row);
    setModalOpen(true);
  };

  return (
    <PageContainer data-testid='pagecontainer-3zbk'>
      <PatientImmunisationsModal
        maxWidth="lg"
        fullWidth={false}
        open={modalOpen}
        patient={patient}
        onClose={() => setModalOpen(false)}
        data-testid='patientimmunisationsmodal-pk75' />
      <TopBar title="COVID campaign" data-testid='topbar-hjrc' />
      <ImmunisationSearchBar onSearch={setSearchParameters} data-testid='immunisationsearchbar-k0b2' />
      <ContentPane data-testid='contentpane-bnlu'>
        <PatientCovidCampaignTable
          getVaccines={getPatientVaccinations}
          onPatientSelect={onRowClick}
          fetchOptions={searchParameters}
          data-testid='patientcovidcampaigntable-bi5w' />
      </ContentPane>
    </PageContainer>
  );
};
