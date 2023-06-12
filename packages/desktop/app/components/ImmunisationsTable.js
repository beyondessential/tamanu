import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getSchedule = record => record.scheduledVaccine?.schedule || 'Unknown';
const getVaccineName = record => record.scheduledVaccine?.label || 'Unknown';
const getDate = ({ date }) => <DateDisplay date={date} />;
const getGiver = record => record.givenBy || '';
const getArea = record =>
  record.location?.locationGroup?.name || record.encounter?.location?.locationGroup?.name || '';
const getInjectionSite = ({ injectionSite }) => injectionSite || 'Unknown';
const getBatch = ({ batch }) => batch || 'Unknown';

const columns = [
  { key: 'schedule', title: 'Schedule', accessor: getSchedule },
  { key: 'vaccine', title: 'Vaccine', accessor: getVaccineName },
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'givenBy', title: 'Given by', accessor: getGiver },
  { key: 'locationGroup', title: 'Area', accessor: getArea },
  { key: 'injectionSite', title: 'Injection site', accessor: getInjectionSite },
  { key: 'batch', title: 'Batch', accessor: getBatch },
];

export const ImmunisationsTable = React.memo(({ patient, onItemClick }) => (
  <DataFetchingTable
    endpoint={`patient/${patient.id}/administeredVaccines`}
    columns={columns}
    onRowClick={row => onItemClick(row)}
    noDataMessage="No vaccinations found"
  />
));
