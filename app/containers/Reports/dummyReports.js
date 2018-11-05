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

export const dummyData = (new Array(220)).fill(0)
  .map(x => ({
    date: randomDate().toDate(),
  }));

// hardcoded report reducer for now
export const patientsPerDay = {
  name: 'Patients per day',
  reducer: (totals, row) => {
    const key = row.date;
    return { 
      ...totals,
      [key]: (totals[key] || 0) + 1
    };
  },
};
