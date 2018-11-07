import moment from 'moment';

// hardcoded reports to click through to
export const availableReports = [
  { id: 'patients-per-day', name: "Patients per day" },
  { id: 'patients-per-clinician', name: "Patients per clinician" },
  { id: 'diagnosis-over-time', name: "Instances of diagnosis" },
  { id: 'breakdown-of-age-groups', name: "Age group breakdown" },
  { id: 'breakdown-of-diagnosis', name: "Diagnosis breakdown" },
];

// generate some visits on some random dates
const randomDate = () => {
  const offset = Math.random() * 25 + Math.random() * 15;
  return moment().subtract(Math.floor(offset), 'days');
};

const randomChoice = (array) => {
  const idx = Math.floor(Math.random() * array.length);
  return array[idx];
};

// hardcoded report reducer for now
export const patientsPerDay = {
  name: 'Patients per day',
  reducer: (totals, row) => {
    const key = moment(row.date).startOf('day').toDate();
    return { 
      ...totals,
      [key]: (totals[key] || 0) + 1
    };
  },
};

function generateDummyOptions(values) {
  return values.split(/\s*\n\s*/g)
    .filter(x => x)
    .sort()
    .map(x => ({ 
      label: x,
      value: x.toLowerCase().replace(/\W+/g, '-')
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

export const dummyData = (new Array(220)).fill(0)
  .map(x => ({
    date: randomDate().toDate(),
    diagnosis: randomChoice(diagnosisOptions).value,
    location: randomChoice(locationOptions).value,
    prescriber: randomChoice(prescriberOptions).value,
    age: Math.floor(Math.random() * 40) + Math.floor(Math.random() * 30),
    sex: (Math.random() < 0.5) ? 'male' : 'female',
  }));
