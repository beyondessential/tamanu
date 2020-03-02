import { formatPatientInfo } from './utils';

export const returnVivaxReport = async (db, { startDate, endDate }) => {
  const baseDiagnoses = db
    .objects('patientDiagnosis')
    .filtered("diagnosis.name CONTAINS[c] 'vivax'")
    .filtered('date >= $0 AND date <= $1', startDate, endDate)
    .sorted('date');

  const counts = {};
  const repeats = {};
  baseDiagnoses.forEach(x => {
    const patientId = x.visit[0].patient[0]._id;
    counts[patientId] = (counts[patientId] || 0) + 1;
    if (counts[patientId] > 1) {
      repeats[patientId] = x;
    }
  });

  const rowData = Object.values(repeats).map(diagnosis => ({
    ...formatPatientInfo(diagnosis.visit[0].patient[0]),
    diagnosis: diagnosis.diagnosis.name,
    date: diagnosis.date,
  }));

  return {
    headers: ['id', 'name', 'village', 'diagnosis', 'lastDiagnosed'],
    rowData,
  };
};
