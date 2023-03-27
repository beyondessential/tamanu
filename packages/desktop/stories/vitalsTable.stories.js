import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { VitalsTable } from '../app/components/VitalsTable';
import { MockedApi } from './utils/mockedApi';

const Container = styled.div`
  max-width: 800px;
  padding: 2rem;
`;

const endpoints = {
  'encounter/:id/vitals': () => {
    return {
      count: 11,
      data: [
        {
          name: 'AVPU',
          config: '',
          records: { '2022-11-29': 'Pain' },
          dataElementId: 'pde-PatientVitalsAVPU',
        },
        {
          name: 'DBP',
          config: '',
          records: { '2022-11-29': '666' },
          dataElementId: 'pde-PatientVitalsDBP',
        },
        {
          name: 'Date',
          config: '',
          records: {
            '2022-11-28': '2022-11-28',
            '2022-11-29': '2022-11-29',
            '2022-11-29 10:09:59': '2022-11-29 10:09:59',
            '2022-11-29 10:13:29': '2022-11-29 10:13:29',
            '2022-11-29 10:16:14': '2022-11-29 10:16:14',
            '2022-11-29 10:23:07': '2022-11-29 10:23:07',
            '2022-12-01 10:56:20': '2022-12-01 10:56:20',
            '2022-12-02 00:55:00': '2022-12-02 00:55:00',
          },
          dataElementId: 'pde-PatientVitalsDate',
        },
        {
          name: 'HeartRate',
          config: '{"unit": "BPM"}',
          records: { '2022-11-29': '555', '2022-11-29 10:23:07': '123' },
          dataElementId: 'pde-PatientVitalsHeartRate',
        },
        {
          name: 'Height',
          config: '{"unit": "cm"}',
          records: {
            '2022-11-28': '123',
            '2022-11-29': '999',
            '2022-11-29 10:16:14': '555',
            '2022-12-02 00:55:00': '175',
          },
          dataElementId: 'pde-PatientVitalsHeight',
        },
        {
          name: 'RespiratoryRate',
          config: '',
          records: { '2022-11-29': '444' },
          dataElementId: 'pde-PatientVitalsRespiratoryRate',
        },
        {
          name: 'SBP',
          config: '',
          records: { '2022-11-29': '777' },
          dataElementId: 'pde-PatientVitalsSBP',
        },
        {
          name: 'SPO2',
          config: '{"unit": "%"}',
          records: { '2022-11-29': '222' },
          dataElementId: 'pde-PatientVitalsSPO2',
        },
        {
          name: 'Temperature',
          config: '{"unit": "oC"}',
          records: { '2022-11-29': '333' },
          dataElementId: 'pde-PatientVitalsTemperature',
        },
        {
          name: 'Weight',
          config: '{"unit": "kg"}',
          records: { '2022-11-29': '888', '2022-12-01 10:56:20': '76' },
          dataElementId: 'pde-PatientVitalsWeight',
        },
      ],
    };
  },
};

storiesOf('Vitals', module)
  .addDecorator(Story => (
    <MockedApi endpoints={endpoints}>
      <Container>
        <Story />
      </Container>
    </MockedApi>
  ))
  .add('Vitals Table', () => {
    return <VitalsTable />;
  });
