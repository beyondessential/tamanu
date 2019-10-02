import React from 'react';

import { Table } from './Table';
import { DateDisplay } from './DateDisplay';

const getDrugName = ({ drug }) => drug.name;

const COLUMNS = [
  { key: 'date', title: 'Date', accessor: ({ date }) => <DateDisplay date={date} /> },
  { key: 'drug', title: 'Drug', accessor: getDrugName },
  { key: 'qtyMorning', title: 'Morning' },
  { key: 'qtyLunch', title: 'Lunch' },
  { key: 'qtyEvening', title: 'Evening' },
  { key: 'qtyNight', title: 'Night' },
];

export const MedicationTable = React.memo(({ medications }) => <Table columns={COLUMNS} data={medications} />);
