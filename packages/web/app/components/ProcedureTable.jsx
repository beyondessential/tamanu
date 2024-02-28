import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TranslatedText } from './Translation/TranslatedText';
import { TranslatedReferenceData } from './Translation/TranslatedReferenceData';

const getProcedureLabel = ({ procedureType }) => (
  <TranslatedReferenceData 
    fallback={procedureType.name} 
    value={procedureType.id} 
    category={procedureType.type} />
);
const getCodeLabel = ({ procedureType }) => procedureType.code;

const COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText stringId="general.table.column.date" fallback="date" />,
    accessor: ({ date }) => <DateDisplay date={date} />,
  },
  {
    key: 'ProcedureType.code',
    title: <TranslatedText stringId="procedure.table.column.code" fallback="Code" />,
    accessor: getCodeLabel,
  },
  {
    key: 'ProcedureType.name',
    title: <TranslatedText stringId="procedure.table.column.name" fallback="Procedure" />,
    accessor: getProcedureLabel,
  },
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
