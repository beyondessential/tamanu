import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getActualDateTime = ({ date, startTime }) => {
  // Both date and startTime only keep track of either date or time, accordingly.
  // This grabs both relevant parts for the table.
  const actualDateTime = date.slice(0, -8).concat(startTime.slice(-8));
  return actualDateTime;
};

const getProcedureLabel = ({ procedureType }) => procedureType.name;
const getCodeLabel = ({ procedureType }) => procedureType.code;
const getActualDateTimeAccessor = row => {
  const actualDateTime = getActualDateTime(row);
  return <DateDisplay date={actualDateTime} />
};

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: getActualDateTimeAccessor },
  { key: 'ProcedureType.code', title: 'Code', accessor: getCodeLabel },
  { key: 'ProcedureType.name', title: 'Procedure', accessor: getProcedureLabel },
];

const sortByDateTime = (a, b) => {
  const aDateTime = getActualDateTime(a);
  const bDateTime = getActualDateTime(b);

  if (aDateTime < bDateTime) {
    return -1;
  } else if (aDateTime > bDateTime) {
    return 1;
  }
  return 0;
};

export const ProcedureTable = React.memo(({ encounterId, onItemClick }) => (
  <DataFetchingTable
    columns={COLUMNS}
    endpoint={`encounter/${encounterId}/procedures`}
    onRowClick={row => onItemClick(row)}
    elevated={false}
    initialSort={{ orderBy: 'date', order: 'desc' }}
  />
));
