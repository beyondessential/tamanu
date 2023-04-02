import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { StatusTag } from './Tag';
import { Colors } from '../constants';
import { VACCINE_STATUS } from '../../../shared-src/src/constants/vaccines';

const getSchedule = record => record.scheduledVaccine?.schedule || 'N/A';
const getVaccineName = record => record.vaccineName || record.scheduledVaccine?.label || 'Unknown';
const getDate = ({ date }) => <DateDisplay date={date} />;
const getGiver = record => {
  if (record.status === VACCINE_STATUS.NOT_GIVEN) {
    return (
      <StatusTag $background="#4444441a" $color={Colors.darkestText}>
        Not given
      </StatusTag>
    );
  }
  if (record.givenElsewhere) {
    return 'Given elsewhere';
  }
  return record.givenBy || 'Unknown';
};
const getFacility = record =>
  record.givenElsewhere ? record.givenBy : record.location?.facility?.name;

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
