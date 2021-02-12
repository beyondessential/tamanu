import { Chance } from 'chance';
import { ReferenceDataType } from '~/types';
import { SyncRecord } from '~/services/sync/source';

// for dummy data generation
import { generatePatient } from '~/dummyData/patients';
import { ICD10_DIAGNOSES } from './diagnoses';

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

const makeCode = (x: string) => x.replace(/\W/g, '').toUpperCase();

const makeRefRecords = (referenceDataType: ReferenceDataType, values: string) => {
  return values
    .split(/\n/)
    .map(x => x.trim())
    .filter(x => x)
    .map(x => ({
      name: x,
      code: makeCode(x),
      id: makeCode(x),
      type: referenceDataType,
      lastModified: generator.date({ year: 1971, month: 1, day: 0 }),
    }));
};

const FACILITIES = makeRefRecords(ReferenceDataType.Facility, `
  Suva Hospital
  Lautoka Hospital
  Nadi Hospital
`);

const DEPARTMENTS = makeRefRecords(ReferenceDataType.Department, `
  Medical
  Renal
  Emergency
  Surgical
  Diabetes
  HIV
  Tuberculosis
  Paediatric
  Neonatal
  Antenatal
  Laboratory
  Radiology
  Pharmacy
`);

const LOCATIONS = makeRefRecords(ReferenceDataType.Location, `
  Bed 1
  Bed 2
  Bed 3
  Diabetes Clinic
  Resuscitation
  Short-Stay
  Acute Area
  Waiting Area
`);

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
  ...FACILITIES,
  ...VILLAGES,
  ...DEPARTMENTS,
  ...LOCATIONS,
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
