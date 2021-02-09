import React from 'react';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { noteTypes } from '../constants';

const getTypeLabel = ({ noteType }) => noteTypes.find(x => x.value === noteType).label;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} showTime /> },
  { key: 'noteType', title: 'Type', accessor: getTypeLabel },
  { key: 'content', title: 'Content' },
];

export const NoteTable = React.memo(({ encounterId }) => (
  <DataFetchingTable columns={COLUMNS} endpoint={`encounter/${encounterId}/notes`} />
));
