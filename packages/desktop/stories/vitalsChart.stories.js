import React from 'react';
import { storiesOf } from '@storybook/react';
import { addHours, format } from 'date-fns';
import { Modal } from '../app/components/Modal';
import { LineChart } from '../app/components/Charts/LineChart';

const getDate = amount => format(addHours(new Date(), amount), 'yyyy-MM-dd HH:mm:ss');
const rawData = [
  {
    name: getDate(-1),
    value: 35,
  },
  {
    name: getDate(-2),
    value: 36,
  },
  {
    name: getDate(-3),
    value: 39,
  },
  {
    name: getDate(-6),
    value: 40,
  },
  {
    name: getDate(-10),
    value: 41,
  },
  {
    name: getDate(-12),
    value: 40,
  },
  {
    name: getDate(-14),
    value: 41.1,
  },
  {
    name: getDate(-16),
    value: 38,
  },
  {
    name: getDate(-18),
    value: 35,
  },
  {
    name: getDate(-20),
    value: 35,
  },
];

const yAxisConfigs = {
  normalRange: { min: 35, max: 39 },
  graphRange: { min: 33, max: 41 },
  interval: 1,
};

storiesOf('Vitals', module).add('Vital Chart', () => {
  return (
    <Modal title="Vital Chart" open width="lg">
      <LineChart rawData={rawData} yAxisConfigs={yAxisConfigs} />
    </Modal>
  );
});
