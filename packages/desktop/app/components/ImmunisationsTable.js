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
  { key: 'vaccine', title: 'Referral date', accessor: getVaccineName },
  { key: 'date', title: 'Referral date', accessor: getDate },
  { key: 'administered', title: 'Referral date', accessor: getAdministerer },
  { key: 'facility', title: 'Facility', accessor: getFacility },
  { key: 'batch', title: 'Referral date', accessor: getBatch },
  { key: 'manafacturer', title: 'Referring doctor', accessor: getManufacturer },
];

export const ImmunisationsTable = React.memo(({ patient }) => (
  <DataFetchingTable
    endpoint={`patient/${patient.id}/immunisations`}
    columns={columns}
    noDataMessage="No vaccines registered"
  />
));
