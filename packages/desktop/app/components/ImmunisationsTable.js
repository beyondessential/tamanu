import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getSchedule = record => record.scheduledVaccine?.schedule || 'Unknown';
const getVaccineName = record => record.scheduledVaccine?.label || 'Unknown';
const getDate = ({ date }) => <DateDisplay date={date} />;
const getAdministerer = record => record.encounter?.examiner?.displayName || 'Unknown';
const getFacility = record => record.encounter?.location?.name || '';
const getBatch = ({ batch }) => batch || 'Unknown';

const columns = [
  { key: 'schedule', title: 'Schedule', accessor: getSchedule },
  { key: 'vaccine', title: 'Vaccine', accessor: getVaccineName },
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'givenBy', title: 'Given by', accessor: getAdministerer },
  { key: 'facility', title: 'Facility', accessor: getFacility },
  { key: 'batch', title: 'Batch', accessor: getBatch },
];

export const ImmunisationsTable = React.memo(({ patient }) => (
  <DataFetchingTable
    endpoint={`patient/${patient.id}/administeredVaccine`}
    columns={columns}
    noDataMessage="No vaccinations found"
  />
));
