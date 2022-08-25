import { Chance } from 'chance';
import { AVPUType } from '~/types';
import { PatientVitalsProps } from '../../interfaces/PatientVitalsProps';

const chance = new Chance();

const createPatientTableData = (): PatientVitalsProps[] => new Array(30).fill(0).map(() => ({
  height: chance.integer({ min: 0, max: 212 }),
  weight: chance.integer({ min: 0, max: 90 }),
  temperature: chance.integer({ min: 0, max: 100 }),
  sbp: chance.integer({ min: 0, max: 100 }),
  dbp: chance.integer({ min: 0, max: 100 }),
  heartRate: chance.integer({ min: 0, max: 90 }),
  respiratoryRate: chance.integer({ min: 60, max: 200 }),
  sv02: chance.integer({ min: 0, max: 90 }),
  avpu: chance.pickone([AVPUType.Alert, AVPUType.Pain, AVPUType.Unresponsive, AVPUType.Verbal]),
  date: chance.date(),
}));

export const patientHistoryList = createPatientTableData();
