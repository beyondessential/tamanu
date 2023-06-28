import React from 'react';
import { storiesOf } from '@storybook/react';
import { addHours, addDays, format } from 'date-fns';
import { Modal } from '../app/components/Modal';
import { LineChart } from '../app/components/Charts/LineChart';
import { EncounterContext } from '../app/contexts/Encounter';

const getDate = amount => format(addHours(new Date(), amount), 'yyyy-MM-dd HH:mm:ss');
const data = [
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
const inwardArrowData = data.map(item => ({
  ...item,
  inwardArrowVector: {
    top: item.value,
    bottom: item.value - (Math.random() * 2).toFixed(2),
  },
}));
const visualisationConfig = {
  hasVitalChart: true,
  yAxis: {
    normalRange: { min: 35, max: 39 },
    graphRange: { min: 33, max: 41 },
    interval: 1,
  },
};

storiesOf('Vitals', module)
  .addDecorator(Story => (
    <EncounterContext.Provider
      value={{
        encounter: { id: 'encounter_id' },
      }}
    >
      <Story />
    </EncounterContext.Provider>
  ))
  .add('Vital Chart', () => {
    return (
      <Modal title="Vital Chart" open width="xl">
        <LineChart
          chartData={data}
          visualisationConfig={visualisationConfig}
          startDate={format(addDays(new Date(), -1), 'yyyy-MM-dd HH:mm:ss')}
          endDate={format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
        />
      </Modal>
    );
  })
  .add('Empty Vital Chart', () => {
    return (
      <Modal title="Empty Vital Chart" open width="xl">
        <LineChart
          chartData={[]}
          visualisationConfig={visualisationConfig}
          startDate={format(addDays(new Date(), -1), 'yyyy-MM-dd HH:mm:ss')}
          endDate={format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
        />
      </Modal>
    );
  })
  .add('Inward Arrow Vital Chart', () => {
    return (
      <Modal title="Inward Arrow Vital Chart" open width="xl">
        <LineChart
          chartData={inwardArrowData}
          visualisationConfig={visualisationConfig}
          startDate={format(addDays(new Date(), -1), 'yyyy-MM-dd HH:mm:ss')}
          endDate={format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
          useInwardArrowVector
        />
      </Modal>
    );
  });
