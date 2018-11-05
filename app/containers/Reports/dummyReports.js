import moment from 'moment';

export const availableReports = [
  { id: 'patients-per-day', name: "Patients per day" },
  { id: 'patients-per-clinician', name: "Patients per clinician" },
  { id: 'diagnosis-over-time', name: "Instances of diagnosis" },
  { id: 'breakdown-of-age-groups', name: "Age group breakdown" },
  { id: 'breakdown-of-diagnosis', name: "Diagnosis breakdown" },
];

const randomDate = () => {
  const offset = Math.random() * 25 + Math.random() * 15;
  return moment().add(Math.floor(offset), 'days');
};

export const dummyData = (new Array(220)).fill(0)
  .map(x => ({
    date: randomDate().toDate(),
  }));

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
