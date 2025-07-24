import { Chance } from 'chance';
import { IReferenceData, ReferenceDataType } from '~/types';
import { SyncRecord } from '~/services/sync/types';
import { VisibilityStatus } from '~/visibilityStatuses';

// for dummy data generation
import { generatePatient } from '~/dummyData/patients';
import { DIAGNOSES } from './diagnoses';
import { splitIds } from './utilities';

const generator = new Chance('patients');
const DUMMY_PATIENT_COUNT = 44;
const dummyPatients = new Array(DUMMY_PATIENT_COUNT)
  .fill(0)
  .map(() => generatePatient(generator))
  .map(p => ({
    ...p,
    lastModified: generator.date({ year: 1971, month: 0, day: 0 }),
  }));

const sortByModified = (a: SyncRecord, b: SyncRecord) => a.data.lastModified - b.data.lastModified;

const dummyPatientRecords: SyncRecord[] = dummyPatients.map(p => ({
  id: p.id + '_sync',
  recordId: p.id,
  data: p,
  recordType: 'Patient',
}));

const makeRefRecords = (referenceDataType: ReferenceDataType, values: string): IReferenceData[] =>
  splitIds(values).map(record => ({
    ...record,
    type: referenceDataType,
    lastModified: generator.date({ year: 1971, month: 1, day: 0 }),
    visibilityStatus: VisibilityStatus.Current,
  }));

const villageRefData = makeRefRecords(
  ReferenceDataType.Village,
  `
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
`,
);

const diagnosisRefData = makeRefRecords(ReferenceDataType.Diagnosis, DIAGNOSES);

const dummyReferenceData: SyncRecord[] = [...villageRefData, ...diagnosisRefData].map(data => ({
  id: data.id + '_sync',
  recordId: data.id,
  data,
  recordType: 'ReferenceData',
}));

export const dummyReferenceRecords = [...dummyPatientRecords, ...dummyReferenceData].sort(
  sortByModified,
);
