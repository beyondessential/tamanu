import { Chance } from 'chance';
import { IReferenceData, ReferenceDataType } from '~/types';
import { SyncRecord } from '~/services/sync/source';

// for dummy data generation
import { generatePatient } from '~/dummyData/patients';
import { ICD10_DIAGNOSES } from './diagnoses';
import { splitIds } from './utilities';

const generator = new Chance('patients');
const DUMMY_PATIENT_COUNT = 44;
const dummyPatients = (new Array(DUMMY_PATIENT_COUNT))
  .fill(0)
  .map(() => generatePatient(generator))
  .map(p => ({
    ...p,
    lastModified: generator.date({ year: 1971, month: 0, day: 0 }),
  }));

const sortByModified = (
  a: SyncRecord,
  b: SyncRecord,
): any => a.data.lastModified - b.data.lastModified;

const dummyPatientRecords: SyncRecord[] = dummyPatients.map(p => ({
  data: p,
  recordType: 'patient',
}));

const makeRefRecords = (referenceDataType: ReferenceDataType, values: string): IReferenceData[] =>
  splitIds(values).map(record => ({
    ...record,
    type: referenceDataType,
    lastModified: generator.date({ year: 1971, month: 1, day: 0 }),
  }));

const VILLAGES = makeRefRecords(ReferenceDataType.Village, `
  Ba
  Lami
  Levuka
  Nausori
  Savusavu
  Sigatoka
  Tavua
  Rakiraki
  Navua
  Korovou
  Nasinu
`);

const DIAGNOSES = makeRefRecords(ReferenceDataType.ICD10, ICD10_DIAGNOSES);

const dummyReferenceData: SyncRecord[] = [
  ...VILLAGES,
  ...DIAGNOSES,
]
  .map(data => ({
    data,
    recordType: 'referenceData',
  }));

export const dummyReferenceRecords = [
  ...dummyPatientRecords,
  ...dummyReferenceData,
].sort(sortByModified);
