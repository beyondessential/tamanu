import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getVaccineName = ({ vaccine }) => (vaccine ? vaccine.name : 'Unknown');
const getDate = ({ date }) => <DateDisplay date={date} />;
const getAdministerer = ({ administerer }) => (administerer ? administerer.name : 'Unknown');
const getFacility = ({ facility }) => (facility ? facility.name : 'Unknown');
const getBatch = ({ batch }) => (batch ? batch.name : 'Unknown');
const getManufacturer = ({ manufacturer }) => (manufacturer ? manufacturer.name : 'Unknown');

const columns = [
  { key: 'vaccine', title: 'Vaccine', accessor: getVaccineName },
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'administered', title: 'Given by', accessor: getAdministerer },
  { key: 'facility', title: 'Facility', accessor: getFacility },
  { key: 'batch', title: 'Batch', accessor: getBatch },
  { key: 'manafacturer', title: 'Manufacturer', accessor: getManufacturer },
];

export const ImmunisationsTable = React.memo(({ patient }) => (
  <DataFetchingTable
    endpoint={`patient/${patient.id}/immunisations`}
    columns={columns}
    noDataMessage="No vaccines registered"
  />
));
