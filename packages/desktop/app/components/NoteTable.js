import React from 'react';

import { Table } from './Table';
import { DateDisplay } from './DateDisplay';
import { noteTypes } from '../constants';

const getTypeLabel = ({ type }) => noteTypes.find(x => x.value === type).label;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'type', title: 'Type', accessor: getTypeLabel },
  { key: 'content', title: 'Content' },
];

export const NoteTable = React.memo(({ notes }) => <Table columns={COLUMNS} data={notes} />);
