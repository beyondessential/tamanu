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
  record.givenElsewhere ? record.givenBy : record.location?.facility?.name;

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
