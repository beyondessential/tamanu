import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';

const getProcedureLabel = ({ procedureType }) => procedureType.name;
const getCodeLabel = ({ procedureType }) => procedureType.code;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'ProcedureType.code', title: 'Code', accessor: getCodeLabel },
  { key: 'ProcedureType.name', title: 'Procedure', accessor: getProcedureLabel },
];

export const ProcedureTable = React.memo(({ encounterId, onItemClick }) => (
  <DataFetchingTable
    columns={COLUMNS}
    endpoint={`encounter/${encounterId}/procedures`}
    onRowClick={row => onItemClick(row)}
    elevated={false}
  />
));
