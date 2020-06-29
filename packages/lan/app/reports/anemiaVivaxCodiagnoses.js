import { formatPatientInfo } from './utils';

export const anemiaVivaxCodiagnosesReport = {
  title: 'Codiagnoses of anemia and malaria (vivax)',
  parameters: [
    { name: 'startDate', type: 'date', label: 'Start date' },
    { name: 'endDate', type: 'date', label: 'End date' },
  ],
  run: async (db, { startDate, endDate }) => {
    const baseDiagnoses = db
      .objects('patientDiagnosis')
      .filtered('date >= $0 AND date <= $1', startDate, endDate);

    const vivaxDiagnoses = baseDiagnoses.filtered("diagnosis.name CONTAINS[c] 'vivax'");

    const anemiaDiagnoses = baseDiagnoses.filtered("diagnosis.name CONTAINS[c] 'anemia'");

    const vivaxPatientIds = new Set(vivaxDiagnoses.map(d => d.encounter[0].patient[0]._id));
    const anemiaPatientIds = new Set(anemiaDiagnoses.map(d => d.encounter[0].patient[0]._id));
    const bothPatientIds = new Set([...vivaxPatientIds].filter(x => anemiaPatientIds.has(x)));

    const rowData = [...vivaxDiagnoses, ...anemiaDiagnoses]
      .filter(d => bothPatientIds.has(d.encounter[0].patient[0]._id))
      .map(d => ({
        ...formatPatientInfo(d.encounter[0].patient[0]),
        diagnosis: d.diagnosis.name,
        date: d.date,
      }));

    return {
      headers: ['id', 'name', 'village', 'diagnosis', 'date'],
      rowData,
    };
  },
};
