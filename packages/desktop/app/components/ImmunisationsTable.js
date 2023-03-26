import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getSchedule = record => record.scheduledVaccine?.schedule || 'Unknown';
const getVaccineName = record => record.scheduledVaccine?.label || 'Unknown';
const getDate = ({ date }) => <DateDisplay date={date} />;
const getGiver = record => {
  if (record.status === 'NOT_GIVEN') {
    return 'Not Given';
  }
  if (record.givenOverseas) {
    return 'Given Overseas';
  }
  return record.givenBy ? record.givenBy : 'Unknown';
};
const getFacility = record =>
  !record.givenOverseas ? record.location?.facility?.name : record.givenBy;

const columns = [
  { key: 'vaccine', title: 'Vaccine', accessor: getVaccineName },
  { key: 'schedule', title: 'Schedule', accessor: getSchedule },
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'givenBy', title: 'Given by', accessor: getGiver },
  { key: 'facility', title: 'Facility/Country', accessor: getFacility },
];

export const ImmunisationsTable = React.memo(({ patient, onItemClick }) => (
  <DataFetchingTable
    endpoint={`patient/${patient.id}/administeredVaccines`}
    initialSort={[['date', 'desc']]}
    columns={columns}
    onRowClick={row => onItemClick(row)}
    noDataMessage="No vaccinations found"
  />
));
