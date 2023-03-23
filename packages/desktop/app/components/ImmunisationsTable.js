import React, { useState } from 'react';
import styled from 'styled-components';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { CheckInput } from './Field';
import { Colors } from '../constants';

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
