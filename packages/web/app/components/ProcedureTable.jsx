import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TranslatedText, TranslatedReferenceData } from './Translation';

const getProcedureLabel = ({ procedureType }) => (
  <TranslatedReferenceData
    fallback={procedureType.name}
    value={procedureType.id}
    category={procedureType.type}
    data-test-id='translatedreferencedata-5uqn' />
);
const getCodeLabel = ({ procedureType }) => procedureType.code;

const COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-test-id='translatedtext-xerp' />,
    accessor: ({ date }) => <DateDisplay date={date} data-test-id='datedisplay-bfwe' />,
  },
  {
    key: 'ProcedureType.code',
    title: <TranslatedText
      stringId="procedure.table.column.code"
      fallback="Code"
      data-test-id='translatedtext-9f7k' />,
    accessor: getCodeLabel,
  },
  {
    key: 'ProcedureType.name',
    title: <TranslatedText
      stringId="procedure.table.column.name"
      fallback="Procedure"
      data-test-id='translatedtext-yuyq' />,
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
    data-test-id='datafetchingtable-42je' />
));
