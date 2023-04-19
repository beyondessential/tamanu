import React, { useState } from 'react';
import styled from 'styled-components';

import { VACCINE_STATUS } from 'shared/constants/vaccines';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { CheckInput } from './Field';
import { StatusTag } from './Tag';
import { Colors } from '../constants';

const getSchedule = record => record.scheduledVaccine?.schedule || 'N/A';
const getVaccineName = record => record.vaccineName || record.scheduledVaccine?.label || 'Unknown';
const getDate = ({ date }) => (date ? <DateDisplay date={date} /> : 'Unknown');
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
const getFacility = record => {
  const facility = record.givenElsewhere ? record.givenBy : record.location?.facility?.name;
  return facility || '';
};

const columns = [
  { key: 'vaccineDisplayName', title: 'Vaccine', accessor: getVaccineName },
  { key: 'schedule', title: 'Schedule', accessor: getSchedule, sortable: false },
  { key: 'date', title: 'Date', accessor: getDate },
  { key: 'givenBy', title: 'Given by', accessor: getGiver, sortable: false },
  { key: 'displayLocation', title: 'Facility/Country', accessor: getFacility },
];

const TableHeaderCheckbox = styled(CheckInput)`
  color: ${Colors.darkText};
  label {
    display: flex;
    align-items: center;
  }
  .MuiTypography-root {
    font-size: 11px;
    line-height: 15px;
  }
  .MuiButtonBase-root {
    padding: 0 6px;
  }
`;

export const ImmunisationsTable = React.memo(({ patient, onItemClick }) => {
  const [includeNotGiven, setIncludeNotGiven] = useState(false);

  const notGivenCheckBox = (
    <TableHeaderCheckbox
      label="Include vaccines not given"
      value={includeNotGiven}
      onClick={() => setIncludeNotGiven(!includeNotGiven)}
    />
  );

  return (
    <DataFetchingTable
      endpoint={`patient/${patient.id}/administeredVaccines`}
      initialSort={[['date', 'desc']]}
      fetchOptions={{ includeNotGiven }}
      columns={columns}
      optionRow={notGivenCheckBox}
      onRowClick={row => onItemClick(row)}
      noDataMessage="No vaccinations found"
    />
  );
});
