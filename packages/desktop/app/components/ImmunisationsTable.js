import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getSchedule = ({ schedule }) => schedule || 'Unknown';
const getVaccineName = ({ vaccine }) => vaccine || 'Unknown';
const getDate = ({ date }) => <DateDisplay date={date} />;
const getAdministerer = ({ givenBy }) => (givenBy || {}).displayName || 'Unknown';
const getFacility = ({ facility }) => (facility || {}).name || '';
const getBatch = ({ batch }) => batch || 'Unknown';
const getTimeliness = ({ timeliness }) => timeliness || 'Unknown';

const columns = [
  { key: 'schedule', title: 'Schedule', accessor: getSchedule },
  { key: 'vaccine', title: 'Vaccine', accessor: getVaccineName },
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'givenBy', title: 'Given by', accessor: getAdministerer },
  { key: 'facility', title: 'Facility', accessor: getFacility },
  { key: 'batch', title: 'Batch', accessor: getBatch },
  { key: 'timeliness', title: 'Timeliness', accessor: getTimeliness },
];

export const ImmunisationsTable = React.memo(({ patient }) => (
  <DataFetchingTable
    endpoint={`patient/${patient.id}/immunisations`}
    columns={columns}
    noDataMessage="No vaccinations found"
  />
));
