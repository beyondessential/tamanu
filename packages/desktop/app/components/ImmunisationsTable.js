import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getSchedule = record => record.scheduledVaccine?.schedule || 'Unknown';
const getVaccineName = record => record.scheduledVaccine?.label || 'Unknown';
const getDate = ({ date }) => <DateDisplay date={date} />;
const getGiver = record => (!record.givenOverseas ? record.givenBy : 'Given Overseas');
// TODO: get the country in the case of overseas vaccines
const getFacility = record =>
  !record.givenOverseas ? record.location?.facility?.name : record.givenBy;

const columns = [
  { key: 'scheduledVaccine.label', title: 'Vaccine', accessor: getVaccineName },
  { key: 'schedule', title: 'Schedule', accessor: getSchedule, sortable: false },
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'givenBy', title: 'Given by', accessor: getGiver, sortable: false },
  { key: 'location.facility.name', title: 'Facility/Country', accessor: getFacility },
];

export const ImmunisationsTable = React.memo(({ patient, onItemClick }) => (
  <DataFetchingTable
    endpoint={`patient/${patient.id}/administeredVaccines`}
    columns={columns}
    onRowClick={onItemClick}
    noDataMessage="No vaccinations found"
    initialSort={{ order: 'desc', orderBy: 'date' }}
  />
));
