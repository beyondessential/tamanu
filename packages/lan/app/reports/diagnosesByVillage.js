export const diagnosesByVillageReport = async (db, { startDate, endDate, village }) => {
  const baseDiagnoses = db
    .objects('patientDiagnosis')
    .filtered(
      'date >= $0 AND date <= $1 AND visit.patient.village.name = $2',
      startDate,
      endDate,
      village,
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
};
