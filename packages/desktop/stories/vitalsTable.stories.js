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
      count: 9,
      data: [
        {
          id: '8211d1d8-a4ac-4c49-b504-51e5116fccf8',
          dateRecorded: '2022-11-29 10:23:07',
          answers: [
            { name: 'HeartRate', value: '123' },
            { name: 'SBP', value: null },
            { name: 'Height', value: null },
            { name: 'Temperature', value: null },
            { name: 'Date', value: '2022-11-29 10:23:07' },
            { name: 'Weight', value: null },
            { name: 'SPO2', value: null },
            { name: 'DBP', value: null },
            { name: 'RespiratoryRate', value: null },
            { name: 'AVPU', value: null },
          ],
        },
        {
          id: '03e3d165-d65b-48a6-b4a7-1deac05d8c99',
          dateRecorded: '2022-11-29 10:16:14',
          answers: [
            { name: 'HeartRate', value: null },
            { name: 'RespiratoryRate', value: null },
            { name: 'DBP', value: null },
            { name: 'SPO2', value: null },
            { name: 'AVPU', value: null },
            { name: 'Date', value: '2022-11-29 10:16:14' },
            { name: 'Temperature', value: null },
            { name: 'Weight', value: null },
            { name: 'SBP', value: null },
            { name: 'Height', value: '555' },
          ],
        },
        {
          id: '49c4061b-cd2c-48a8-9e55-c7ba4d7cd2f4',
          dateRecorded: '2022-11-29 10:13:29',
          answers: [
            { name: 'RespiratoryRate', value: null },
            { name: 'Date', value: '2022-11-29 10:13:29' },
            { name: 'HeartRate', value: null },
            { name: 'DBP', value: null },
            { name: 'SPO2', value: null },
            { name: 'AVPU', value: null },
            { name: 'Temperature', value: null },
            { name: 'SBP', value: null },
            { name: 'Weight', value: null },
            { name: 'Height', value: null },
          ],
        },
        {
          id: '1c3cd402-ebe6-4cd3-a63f-602f3a8b1b37',
          dateRecorded: '2022-11-29 10:09:59',
          answers: [
            { name: 'RespiratoryRate', value: null },
            { name: 'DBP', value: null },
            { name: 'AVPU', value: null },
            { name: 'SPO2', value: null },
            { name: 'SBP', value: null },
            { name: 'Temperature', value: null },
            { name: 'Date', value: '2022-11-29 10:09:59' },
            { name: 'Weight', value: null },
            { name: 'Height', value: null },
            { name: 'HeartRate', value: null },
          ],
        },
        {
          id: '9f3045c6-592e-4c6d-8fce-d0cca4ee2c8f',
          dateRecorded: '2022-11-29',
          answers: [
            { name: 'Weight', value: null },
            { name: 'Height', value: '123' },
            { name: 'Date', value: '2022-11-29' },
            { name: 'HeartRate', value: null },
            { name: 'AVPU', value: null },
            { name: 'DBP', value: null },
            { name: 'RespiratoryRate', value: null },
            { name: 'SPO2', value: null },
            { name: 'Temperature', value: null },
            { name: 'SBP', value: null },
          ],
        },
        {
          id: 'c8778127-148a-4383-bc29-42e5450c6390',
          dateRecorded: '2022-11-29',
          answers: [
            { name: 'DBP', value: '666' },
            { name: 'Weight', value: '888' },
            { name: 'Height', value: '999' },
            { name: 'HeartRate', value: '555' },
            { name: 'RespiratoryRate', value: '444' },
            { name: 'SBP', value: '777' },
            { name: 'SPO2', value: '222' },
            { name: 'Date', value: '2022-11-29' },
            { name: 'AVPU', value: 'Pain' },
            { name: 'Temperature', value: '333' },
          ],
        },
        {
          id: '9ac5a420-7a28-42dd-a258-16ca51a56b45',
          dateRecorded: '2022-11-23',
          answers: [
            { name: 'SBP', value: null },
            { name: 'DBP', value: null },
            { name: 'Date', value: null },
            { name: 'AVPU', value: null },
            { name: 'Temperature', value: null },
            { name: 'SPO2', value: null },
            { name: 'RespiratoryRate', value: null },
            { name: 'Height', value: '123' },
            { name: 'HeartRate', value: null },
            { name: 'Weight', value: null },
          ],
        },
        {
          id: '73c2d20c-b9f7-478c-a0b0-77692787fdb0',
          dateRecorded: '2022-11-22',
          answers: [
            { name: 'RespiratoryRate', value: null },
            { name: 'SPO2', value: null },
            { name: 'SBP', value: null },
            { name: 'Temperature', value: null },
            { name: 'Height', value: null },
            { name: 'HeartRate', value: null },
            { name: 'AVPU', value: null },
            { name: 'DBP', value: null },
            { name: 'Date', value: null },
            { name: 'Weight', value: '333' },
          ],
        },
        {
          id: 'ecc60615-52bc-4fe0-a5ed-e8a340188c5b',
          dateRecorded: '2022-11-21',
          answers: [
            { name: 'RespiratoryRate', value: null },
            { name: 'DBP', value: null },
            { name: 'AVPU', value: null },
            { name: 'HeartRate', value: null },
            { name: 'Weight', value: '123' },
            { name: 'Height', value: '123' },
            { name: 'Temperature', value: null },
            { name: 'SBP', value: null },
            { name: 'SPO2', value: null },
            { name: 'Date', value: null },
          ],
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
