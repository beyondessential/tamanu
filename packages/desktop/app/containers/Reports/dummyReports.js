import moment from 'moment';
import { REPORT_TYPES } from '../../constants';

// hardcoded reports to click through to
export const availableReports = [
  {
    id: 'patients-per-day',
    name: 'Patients per day',
    graphType: 'line',
    getCountKey: row =>
      moment(row.date)
        .startOf('day')
        .toDate(),
  },
  {
    id: 'patients-per-clinician',
    graphType: 'bar',
    name: 'Patients per clinician',
    getCountKey: row => row.prescriber,
  },
  {
    id: 'breakdown-of-age-groups',
    graphType: 'pie',
    name: 'Age group breakdown',
    getCountKey: row => {
      const lowBound = Math.floor(row.age / 10) * 10;
      return `${lowBound}-${lowBound + 10}`;
    },
  },
  {
    id: 'breakdown-of-diagnosis',
    graphType: 'pie',
    name: 'Diagnosis breakdown',
    getCountKey: row => row.diagnosis,
  },
  {
    id: 'custom-report',
    graphType: 'line',
    name: 'Report Builder',
    getCountKey: row =>
      moment(row.date)
        .startOf('day')
        .toDate(),
  },
];

// generate some visits on some random dates
const randomDate = () => {
  const offset = Math.random() * 25 + Math.random() * 15;
  return moment().subtract(Math.floor(offset), 'days');
};

const randomChoice = array => {
  const idx = Math.floor(Math.random() * array.length);
  return array[idx];
};

function generateDummyOptions(values) {
  return values
    .split(/\s*\n\s*/g)
    .filter(x => x)
    .sort()
    .map(x => ({
      label: x,
      value: x.toLowerCase().replace(/\W+/g, '-'),
    }));
}

export const diagnosisOptions = generateDummyOptions(`
  Hypertension
  Hyperlipidemia
  Diabetes
  Back pain
  Anxiety
  Obesity
  Allergic rhinitis
  Reflux esophagitis
  Respiratory problems
  Hypothyroidism
  Visual refractive errors
  General medical exam
  Osteoarthritis
  Fibromyalgia / myositis
  Malaise and fatigue
  Pain in joint
  Acute laryngopharyngitis
  Acute maxillary sinusitis
  Major depressive disorder
  Acute bronchitis
  Asthma
  Depressive disorder
  Nail fungus
  Coronary atherosclerosis
  Urinary tract infection
`);

export const locationOptions = generateDummyOptions(`
  Ward 1
  Ward 2
  Children's Ward
  Maternity Ward
  Surgical Ward
`);

export const prescriberOptions = generateDummyOptions(`
  Dr John Smith
  Dr Jane Brown
  Prof Molly Mollison
  Ms Ian Ianson
`);

export const datasetOptions = generateDummyOptions(`
  Diagnoses
  Procedures
  Visits
  Medications
  Custom...
`);

export const medicationOptions = generateDummyOptions(`
  Medication A
  Medication B
  Medication C
  Medication D
  Medication E
`);

export const procedureOptions = generateDummyOptions(`
  Procedure A
  Procedure B
  Procedure C
  Procedure D
  Procedure E
`);

export const visualisationOptions = [
  {
    dataType: 'datetime',
    graphType: 'line',
    label: 'Line graph',
    value: REPORT_TYPES.LINE_CHART,
  },
  {
    dataType: 'numeric',
    graphType: 'bar',
    label: 'Bar chart',
    value: REPORT_TYPES.BAR_CHART,
  },
  {
    dataType: 'aggregated',
    graphType: 'pie',
    label: 'Pie chart',
    value: REPORT_TYPES.PIE_CHART,
  },
  {
    dataType: 'numeric',
    graphType: 'table',
    label: 'Table',
    value: REPORT_TYPES.TABLE,
  },
];

export const generateData = () => {
  return new Array(220).fill(0).map(_ => ({
    date: randomDate().toDate(),
    diagnosis: randomChoice(diagnosisOptions).value,
    location: randomChoice(locationOptions).value,
    prescriber: randomChoice(prescriberOptions).value,
    medication: randomChoice(medicationOptions).value,
    procedure: randomChoice(procedureOptions).value,
    age: Math.floor(Math.random() * 40) + Math.floor(Math.random() * 30),
    sex: Math.random() < 0.5 ? 'male' : 'female',
  }));
};
