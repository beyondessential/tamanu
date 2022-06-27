export const diagnosesByVillageReport = {
  title: 'Diagnoses by village',
  parameters: [
    { name: 'startDate', type: 'date', label: 'Start date' },
    { name: 'endDate', type: 'date', label: 'End date' },
    { name: 'diagnosis', type: 'string', label: 'Diagnosis search' },
  ],
  run: async (db, { startDate, endDate, diagnosis }) => {
    const baseDiagnoses = db
      .objects('patientDiagnosis')
      .filtered(
        'date >= $0 AND date <= $1 AND diagnosis.name CONTAINS[c] $2',
        startDate,
        endDate,
        diagnosis,
      );

    const counts = {};

    baseDiagnoses.forEach(d => {
      const { village } = d.encounter[0].patient[0];
      if (!counts[village._id]) {
        counts[village._id] = {
          count: 0,
          village: village.name,
        };
      }
      counts[village._id].count += 1;
    });

    return {
      headers: ['village', 'count'],
      rowData: Object.values(counts),
    };
  },
};
