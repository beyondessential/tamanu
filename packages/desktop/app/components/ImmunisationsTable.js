import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { StatusTag } from './Tag';
import { Colors } from '../constants';
import { VACCINE_STATUS } from '../../../shared-src/src/constants/vaccines';

const getSchedule = record => record.scheduledVaccine?.schedule || 'N/A';
const getVaccineName = record => record.vaccineName || record.scheduledVaccine?.label;
const getDate = ({ date }) => <DateDisplay date={date} />;
const getGiver = record => {
  if (record.status === VACCINE_STATUS.NOT_GIVEN) {
    return (
      <StatusTag $background="rgba(68,68,68,0.1)" $color={Colors.darkestText}>
        Not Given
      </StatusTag>
    );
  }
  if (record.givenElsewhere) {
    return 'Given Overseas';
  }
  return record.givenBy ? record.givenBy : 'Unknown';
};
const getFacility = record =>
  !record.givenElsewhere ? record.location?.facility?.name : record.givenBy;

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
