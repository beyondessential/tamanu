import { Chance } from 'chance';
import { ReferenceDataType } from '~/types';

// for dummy data generation
import { generatePatient } from '~/dummyData/patients';
import { ICD10_DIAGNOSES } from './diagnoses';

const VACCINE_TYPES = [
  { id: 'v_1', code: 'BCG', name: 'Tuberculosis' },
  { id: 'v_2', code: 'HepB', name: 'Hepatitis B' },
  { id: 'v_3', code: 'DPT-HepB-Hib', name: 'Pentavalent' },
  { id: 'v_4', code: 'PCV', name: 'Pneumococcal' },
  { id: 'v_5', code: 'IPV', name: 'Inactivated poliovirus' },
  { id: 'v_6', code: 'MR', name: 'Measles-rubella' },
  { id: 'v_7', code: 'TT', name: 'Tetanus' },
];

const CHILDHOOD = ['birth', '24hrs from birth', '6 weeks', '10 weeks', '14 weeks', '1 year', '6 years'];

const generator = new Chance('patients');
const DUMMY_PATIENT_COUNT = 44;
const dummyPatients = (new Array(DUMMY_PATIENT_COUNT))
  .fill(0)
  .map(() => generatePatient(generator))
  .map((p, i) => ({
    ...p,
    lastModified: generator.date({ year: 1971, month: 0, day: 0, second: i }),
  }));

const sortByModified = (a: { data: { lastModified: number; }; }, b: { data: { lastModified: number; }; }) => a.data.lastModified - b.data.lastModified;

const dummyPatientRecords: SyncRecord[] = dummyPatients.map(p => ({
  data: p,
  recordType: 'patient',
}));

const makeDummyVaccineSchedule = (vaccine: { id: any; code?: string; name?: string; }, scheduleArray: any[]) => scheduleArray.map((schedule: any, index: any) => ({ schedule, vaccine: vaccine.id, index }));

const dummyScheduledVaccineRecords: SyncRecord[] = VACCINE_TYPES
  .map(v => makeDummyVaccineSchedule(v, CHILDHOOD))
  .flat()
  .map((v: any, i: any) => ({
    recordType: 'scheduledVaccine',
    data: {
      ...v,
      lastModified: generator.date({ year: 1971, month: 3, day: 0, second: i }),
    },
  }));


  console.log(dummyScheduledVaccineRecords);
const makeCode = (x: string) => x.replace(/\W/g, '').toUpperCase();

const makeRefRecords = (referenceDataType: ReferenceDataType, values: string) => {
  const lines = values
    .split(/\n/)
    .map(x => x.trim())
    .filter(x => x)
    .map((x, i) => ({
      name: x,
      code: makeCode(x),
      id: makeCode(x),
      type: referenceDataType,
      lastModified: generator.date({ year: 1971, month: 1, day: 0, second: i }),
    }));
  // console.log(lines);
  return lines;
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

const VACCINES = VACCINE_TYPES.map((v, i) => ({
  name: v.name,
  code: v.code,
  id: makeCode(v.name),
  type: ReferenceDataType.Vaccine,
  lastModified: generator.date({ year: 1971, month: 2, day: 0, second: i }),
}));

const dummyReferenceData: SyncRecord[] = [
  ...FACILITIES,
  ...VILLAGES,
  ...DEPARTMENTS,
  ...LOCATIONS,
  ...DIAGNOSES,
  ...VACCINES,
]
  .map(data => ({
    data,
    recordType: 'referenceData',
  }));

export const dummyReferenceRecords = [
  ...dummyPatientRecords,
  ...dummyReferenceData,
  ...dummyScheduledVaccineRecords,
].sort(sortByModified);
