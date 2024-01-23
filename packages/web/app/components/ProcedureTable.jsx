import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getProcedureLabel = ({ procedureType }) => procedureType.name;
const getCodeLabel = ({ procedureType }) => procedureType.code;
const getActualDateTime = ({ date, startTime }) => {
  // Both date and startTime only keep track of either date or time, accordingly.
  // This grabs both relevant parts for the table.
  const actualDateTime = date.slice(0, -8).concat(startTime.slice(-8));
  console.log(actualDateTime); // Remove before merge
  return <DateDisplay date={actualDateTime} />
};

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: getActualDateTime },
  { key: 'ProcedureType.code', title: 'Code', accessor: getCodeLabel },
  { key: 'ProcedureType.name', title: 'Procedure', accessor: getProcedureLabel },
];

export const ProcedureTable = React.memo(({ encounterId, onItemClick }) => (
  <DataFetchingTable
    columns={COLUMNS}
    endpoint={`encounter/${encounterId}/procedures`}
    onRowClick={row => onItemClick(row)}
    elevated={false}
    initialSort={{ orderBy: 'date', order: 'desc' }}
  />
));
