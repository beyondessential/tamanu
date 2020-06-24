import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getProcedureLabel = ({ procedureType }) => procedureType.name;
const getCodeLabel = ({ procedureType }) => procedureType.code;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'code', title: 'Code', accessor: getCodeLabel },
  { key: 'type', title: 'Procedure', accessor: getProcedureLabel },
];

export const ProcedureTable = React.memo(({ visitId, onItemClick }) => (
  <DataFetchingTable
    columns={COLUMNS}
    endpoint={`visit/${visitId}/procedures`}
    onRowClick={row => onItemClick(row)}
  />
));
