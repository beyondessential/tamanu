export const diagnosesByVillageReport = {
  title: "Diagnoses by village",
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
      if (!counts[d.diagnosis._id]) {
        counts[d.diagnosis._id] = {
          count: 0,
          diagnosis: d.diagnosis.name,
        };
      }
      counts[d.diagnosis._id].count += 1;
    });

    return {
      headers: ['diagnosis', 'count'],
      rowData: Object.values(counts),
    };
  },
};
