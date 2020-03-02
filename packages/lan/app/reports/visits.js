import { formatPatientInfo } from './utils';

export const visitsReport = async (db, { startDate, endDate }) => {
  const rowData = db
    .objects('visit')
    .filtered('startDate >= $0 AND startDate <= $1', startDate, endDate)
    .map(visit => ({
      ...formatPatientInfo(visit.patient[0]),
      visitType: visit.visitType,
      startDate: visit.startDate,
    }));

  return {
    headers: ['id', 'name', 'village', 'visitType', 'startDate'],
    rowData,
  };
};
