import React from 'react';

import { Table } from './Table';
import { DateDisplay } from './DateDisplay';

const getProcedureLabel = ({ type }) => type.name;
const getCodeLabel = ({ type }) => type.code;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'code', title: 'Code', accessor: getCodeLabel },
  { key: 'type', title: 'Procedure', accessor: getProcedureLabel },
];

export const ProcedureTable = React.memo(({ procedures }) => (
  <Table columns={COLUMNS} data={procedures} />
));
