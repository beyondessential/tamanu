import { formatPatientInfo } from './utils';

export const returnVivaxReport = {
  title: 'Returning cases of malaria (vivax)',
  parameters: [
    { name: 'startDate', type: 'date', label: 'Start date' },
    { name: 'endDate', type: 'date', label: 'End date' },
  ],
  run: async (db, { startDate, endDate }) => {
    const search = 'vivax';
    const baseDiagnoses = db
      .objects('patientDiagnosis')
      .filtered('diagnosis.name CONTAINS[c] $0', search)
      .filtered('date >= $0 AND date <= $1', startDate, endDate)
      .sorted('date');

    const counts = {};
    const repeats = {};
    baseDiagnoses.forEach(x => {
      const patientId = x.encounter[0].patient[0]._id;
      counts[patientId] = (counts[patientId] || 0) + 1;
      if (counts[patientId] > 1) {
        repeats[patientId] = x;
      }
    });

    const rowData = Object.values(repeats).map(diagnosis => ({
      ...formatPatientInfo(diagnosis.encounter[0].patient[0]),
      diagnosis: diagnosis.diagnosis.name,
      date: diagnosis.date,
    }));

    return {
      headers: ['id', 'name', 'village', 'diagnosis', 'lastDiagnosed'],
      rowData,
    };
  },
};
