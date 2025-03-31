import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TranslatedText, TranslatedReferenceData } from './Translation';

const getProcedureLabel = ({ procedureType }) => (
  <TranslatedReferenceData
    fallback={procedureType.name}
    value={procedureType.id}
    category={procedureType.type}
    data-testid='translatedreferencedata-5uqn' />
);
const getCodeLabel = ({ procedureType }) => procedureType.code;

const COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-testid='translatedtext-xerp' />,
    accessor: ({ date }) => <DateDisplay date={date} data-testid='datedisplay-bfwe' />,
  },
  {
    key: 'ProcedureType.code',
    title: <TranslatedText
      stringId="procedure.table.column.code"
      fallback="Code"
      data-testid='translatedtext-9f7k' />,
    accessor: getCodeLabel,
  },
  {
    key: 'ProcedureType.name',
    title: <TranslatedText
      stringId="procedure.table.column.name"
      fallback="Procedure"
      data-testid='translatedtext-yuyq' />,
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
    data-testid='datafetchingtable-42je' />
));
