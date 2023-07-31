import React from 'react';
import styled from 'styled-components';
import { storiesOf } from '@storybook/react';
import { addHours, format } from 'date-fns';
import { VitalsTable } from '../app/components/VitalsTable';
import { MockedApi } from './utils/mockedApi';
import { EncounterContext } from '../app/contexts/Encounter';
import { VitalChartDataProvider } from '../app/contexts/VitalChartData';
import { VitalChartsModal } from '../app/components/VitalChartsModal';

const Container = styled.div`
  max-width: 1300px;
  padding: 2rem;
`;

const getDate = amount => format(addHours(new Date(), amount), 'yyyy-MM-dd HH:mm:ss');
const dateOne = getDate(-1);
const dateTwo = getDate(-2);
const dateThree = getDate(-4);
const dateFour = getDate(-6);
const dateFive = getDate(-8);
const dateSix = getDate(-10);
const dateSeven = getDate(-12);
const dateEight = getDate(-15);

const endpoints = {
  'encounter/:id/vitals': () => {
    return {
      count: 11,
      data: [
        {
          name: 'AVPU',
          config: '',
          records: { [dateOne]: 'Pain' },
          dataElementId: 'pde-PatientVitalsAVPU',
        },
        {
          name: 'DBP',
          config: '',
          records: { [dateOne]: '60' },
          dataElementId: 'pde-PatientVitalsDBP',
        },
        {
          name: 'Date',
          config: '',
          records: {
            [dateTwo]: dateTwo,
            [dateOne]: dateOne,
            [dateThree]: dateThree,
            [dateFour]: dateFour,
            [dateFive]: dateFive,
            [dateSix]: dateSix,
            [dateSeven]: dateSeven,
            [dateEight]: dateEight,
          },
          dataElementId: 'pde-PatientVitalsDate',
        },
        {
          name: 'HeartRate',
          config: '{"unit": "BPM"}',
          records: { [dateOne]: '85', [dateSix]: '80' },
          dataElementId: 'pde-PatientVitalsHeartRate',
        },
        {
          name: 'Height',
          config: '{"unit": "cm"}',
          records: {
            [dateTwo]: '123',
            [dateOne]: '999',
            [dateFive]: '555',
            [dateEight]: '175',
          },
          dataElementId: 'pde-PatientVitalsHeight',
        },
        {
          name: 'RespiratoryRate',
          config: '',
          records: { [dateOne]: '444' },
          dataElementId: 'pde-PatientVitalsRespiratoryRate',
        },
        {
          name: 'SBP',
          config: '',
          records: { [dateOne]: '777' },
          dataElementId: 'pde-PatientVitalsSBP',
        },
        {
          name: 'SPO2',
          config: '{"unit": "%"}',
          records: { [dateOne]: '222' },
          dataElementId: 'pde-PatientVitalsSPO2',
        },
        {
          name: 'Temperature',
          config: '{"unit": "oC"}',
          records: { [dateOne]: '35' },
          dataElementId: 'pde-PatientVitalsTemperature',
        },
        {
          name: 'Weight',
          config: '{"unit": "kg"}',
          records: { [dateOne]: '888', [dateSeven]: '76' },
          dataElementId: 'pde-PatientVitalsWeight',
        },
      ],
    };
  },
  'survey/vitals': () => {
    return {
      id: 'program-patientvitals-patientvitals',
      code: 'PatientVitals',
      name: '(Dev) Vitals',
      surveyType: 'vitals',
      isSensitive: false,
      updatedAtSyncTick: '-999',
      createdAt: '2023-01-05T04:28:02.116Z',
      updatedAt: '2023-02-15T22:08:47.351Z',
      programId: 'program-patientvitals',
      components: [
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsDate',
          screenIndex: 0,
          componentIndex: 0,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '',
          detail: '',
          config: '',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-23T19:38:02.615Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsDate',
          dataElement: {
            id: 'pde-PatientVitalsDate',
            code: 'PatientVitalsDate',
            name: 'Date',
            indicator: null,
            defaultText: 'Date',
            type: 'DateTime',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-05T04:28:02.095Z',
            defaultOptions: null,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsHeight',
          screenIndex: 0,
          componentIndex: 1,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '{"min": 0, "max": 250}',
          detail: '',
          config: '{"unit": "cm"}',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-23T19:38:02.615Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsHeight',
          dataElement: {
            id: 'pde-PatientVitalsHeight',
            code: 'PatientVitalsHeight',
            name: 'Height (cm)',
            indicator: null,
            defaultText: 'Height (cm)',
            type: 'Number',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-05T04:28:02.095Z',
            defaultOptions: null,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsWeight',
          screenIndex: 0,
          componentIndex: 2,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '{"min": 0, "max": 250}',
          detail: '',
          config: '{"unit": "kg"}',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-23T19:38:02.615Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsWeight',
          dataElement: {
            id: 'pde-PatientVitalsWeight',
            code: 'PatientVitalsWeight',
            name: 'Weight (kg)',
            indicator: null,
            defaultText: 'Weight (kg)',
            type: 'Number',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-05T04:28:02.095Z',
            defaultOptions: null,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsBMI',
          screenIndex: 0,
          componentIndex: 3,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '',
          detail: '',
          config: '{"rounding": "1"}',
          calculation: '(PatientVitalsWeight/PatientVitalsHeight/PatientVitalsHeight)*10000',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T20:58:01.788Z',
          updatedAt: '2023-02-23T19:38:02.615Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsBMI',
          dataElement: {
            id: 'pde-PatientVitalsBMI',
            code: 'PatientVitalsBMI',
            name: 'BMI (kg/m2)',
            indicator: null,
            defaultText: 'BMI (kg/m2)',
            type: 'CalculatedQuestion',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T20:58:01.763Z',
            updatedAt: '2023-01-05T20:58:01.763Z',
            defaultOptions: null,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsSBP',
          screenIndex: 0,
          componentIndex: 4,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '{"min": 0, "max": 300, "normalRange": {"min": 90, "max": 120}}',
          detail: '',
          config: '{"unit": "mm Hg"}',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-14T01:44:02.813Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsSBP',
          dataElement: {
            id: 'pde-PatientVitalsSBP',
            code: 'PatientVitalsSBP',
            name: 'SBP (mm Hg)',
            indicator: null,
            defaultText: 'SBP (mm Hg)',
            type: 'Number',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-26T21:52:01.778Z',
            defaultOptions: null,
            visualisationConfig: `{"yAxis":{"graphRange":{"min":30,"max":240},"normalRange":{"min":90,"max":200},"interval":10}}`,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsDBP',
          screenIndex: 0,
          componentIndex: 5,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '{"min": 0, "max": 150, "normalRange": {"min": 60, "max": 80}}',
          detail: '',
          config: '',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-14T01:44:02.814Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsDBP',
          dataElement: {
            id: 'pde-PatientVitalsDBP',
            code: 'PatientVitalsDBP',
            name: 'DBP',
            indicator: null,
            defaultText: 'DBP',
            type: 'Number',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-26T21:52:01.779Z',
            defaultOptions: null,
            visualisationConfig: `{"yAxis":{"graphRange":{"min":30,"max":240},"normalRange":{"min":90,"max":200},"interval":10}}`,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsHeartRate',
          screenIndex: 0,
          componentIndex: 6,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '{"min": 0, "max": 300, "normalRange": {"min": 55, "max": 84}}',
          detail: '',
          config: '{"unit": "BPM"}',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-14T01:44:02.813Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsHeartRate',
          dataElement: {
            id: 'pde-PatientVitalsHeartRate',
            code: 'PatientVitalsHeartRate',
            name: 'Heart Rate (BPM)',
            indicator: null,
            defaultText: 'Heart Rate (BPM)',
            type: 'Number',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-26T21:52:01.778Z',
            defaultOptions: null,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsRespiratoryRate',
          screenIndex: 0,
          componentIndex: 7,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '{"min": 1, "max": 70, "normalRange": {"min": 12, "max": 20}}',
          detail: '',
          config: '{"unit": "BPM"}',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-14T01:44:02.815Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsRespiratoryRate',
          dataElement: {
            id: 'pde-PatientVitalsRespiratoryRate',
            code: 'PatientVitalsRespiratoryRate',
            name: 'Respiratory Rate (BPM)',
            indicator: null,
            defaultText: 'Respiratory Rate (BPM)',
            type: 'Number',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-26T21:52:01.778Z',
            defaultOptions: null,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsTemperature',
          screenIndex: 0,
          componentIndex: 8,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '{"min": 32, "max": 44, "normalRange": {"min": 35.5, "max": 37.5}}',
          detail: '',
          config: '{"unit": "°C", "rounding": "1"}',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-23T19:38:02.614Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsTemperature',
          dataElement: {
            id: 'pde-PatientVitalsTemperature',
            code: 'PatientVitalsTemperature',
            name: 'Temperature (°C)',
            indicator: null,
            defaultText: 'Temperature (°C)',
            type: 'Number',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-05T04:28:02.095Z',
            defaultOptions: null,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsSPO2',
          screenIndex: 0,
          componentIndex: 9,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '{"min": 0, "max": 100, "normalRange": {"min": 97, "max": 100}}',
          detail: '',
          config: '{"unit": "%"}',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-14T01:44:02.815Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsSPO2',
          dataElement: {
            id: 'pde-PatientVitalsSPO2',
            code: 'PatientVitalsSPO2',
            name: 'SpO2',
            indicator: null,
            defaultText: 'SpO2',
            type: 'Number',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-03-02T21:52:14.274Z',
            defaultOptions: null,
            visualisationConfig: `{"yAxis":{"graphRange":{"min":80,"max":100},"normalRange":{"min":85,"max":100},"interval":5}}`,
          },
          options: null,
        },
        {
          id: 'program-patientvitals-patientvitals-PatientVitalsAVPU',
          screenIndex: 0,
          componentIndex: 10,
          text: '',
          visibilityCriteria: '',
          validationCriteria: '',
          detail: '',
          config: '',
          calculation: '',
          updatedAtSyncTick: '-999',
          createdAt: '2023-01-05T04:28:02.132Z',
          updatedAt: '2023-02-14T01:44:02.814Z',
          surveyId: 'program-patientvitals-patientvitals',
          dataElementId: 'pde-PatientVitalsAVPU',
          dataElement: {
            id: 'pde-PatientVitalsAVPU',
            code: 'PatientVitalsAVPU',
            name: 'AVPU',
            indicator: null,
            defaultText: 'AVPU',
            type: 'Select',
            updatedAtSyncTick: '-999',
            createdAt: '2023-01-05T04:28:02.095Z',
            updatedAt: '2023-01-05T04:28:02.095Z',
            defaultOptions: {
              alert: 'Alert',
              verbal: 'Verbal',
              pain: 'Pain',
              unresponsive: 'Unresponsive',
            },
          },
          options: null,
        },
      ],
    };
  },
  'patient/:id': () => {
    return {
      dateOfBirth: '1990-01-01',
    };
  },
};

storiesOf('Vitals', module)
  .addDecorator(Story => (
    <MockedApi endpoints={endpoints}>
      <Container>
        <EncounterContext.Provider
          value={{
            encounter: { id: 'encounter_id' },
          }}
        >
          <VitalChartDataProvider>
            <Story />
          </VitalChartDataProvider>
        </EncounterContext.Provider>
      </Container>
    </MockedApi>
  ))
  .add('Vitals Table', () => {
    return (
      <>
        <VitalChartsModal />
        <VitalsTable />
      </>
    );
  });
