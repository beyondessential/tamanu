import { Chance } from 'chance';
import { PatientVitalsProps } from '/interfaces/PatientVitalsProps';

const chance = new Chance();

const createPatientTableData = (): PatientVitalsProps[] => new Array(30).fill(0).map(() => ({
  bloodPressure: chance.integer({ min: 0, max: 90 }),
  weight: chance.integer({ min: 0, max: 90 }),
  circumference: chance.integer({ min: 0, max: 90 }),
  sp02: chance.integer({ min: 0, max: 90 }),
  heartRate: chance.integer({ min: 0, max: 90 }),
  fev: chance.integer({ min: 0, max: 90 }),
  cholesterol: chance.integer({ min: 0, max: 90 }),
  bloodGlucose: chance.integer({ min: 0, max: 90 }),
  date: chance.date(),
}));

export const patientHistoryList = createPatientTableData();
