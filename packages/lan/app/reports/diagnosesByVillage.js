export const diagnosesByVillageReport = {
  title: 'Diagnoses by village',
  parameters: {
    diagnosis: 'string',
    startDate: 'date',
    endDate: 'date',
  },
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
      const village = d.visit[0].patient[0].village;
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
