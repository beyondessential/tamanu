import XLSX from 'xlsx';
import moment from 'moment';

const formatPatientInfo = p => ({
  name: [p.firstName, p.culturalName, p.lastName].filter(x => x).join(' '),
  village: p.village && p.village.name,
  id: p.displayId
});

const visitsReport = async (db, { startDate, endDate }) => {
  const rowData = db.objects('visit')
    .filtered("startDate >= $0 AND startDate <= $1", startDate, endDate)
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

const numberOfVisitsReport = async (db) => {
  const rowData = db.objects('patient')
    .map(patient => ({
      ...formatPatientInfo(patient),
      visits: patient.visits.length,
    }));

  return {
    headers: ['id', 'name', 'village', 'visits'],
    rowData,
  };
};

const returnVivaxReport = async (db, { startDate, endDate }) => {
  const baseDiagnoses = db.objects('patientDiagnosis')
    .filtered("diagnosis.name CONTAINS[c] 'vivax'")
    .filtered("date >= $0 AND date <= $1", startDate, endDate)
    .sorted("date");
  
  const counts = {};
  const repeats = {};
  baseDiagnoses.forEach(x => {
    const patientId = x.visit[0].patient[0]._id;
    counts[patientId] = (counts[patientId] || 0) + 1;
    if(counts[patientId] > 1) {
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

const diagnosesByVillageReport = async (db, params) => {

};

const anemiaVivaxCodiagnosesReport = async (db, { startDate, endDate }) => {
  const baseDiagnoses = db.objects('patientDiagnosis')
    .filtered("date >= $0 AND date <= $1", startDate, endDate);

  const vivaxDiagnoses = baseDiagnoses
    .filtered("diagnosis.name CONTAINS[c] 'vivax'");

  const anemiaDiagnoses = baseDiagnoses
    .filtered("diagnosis.name CONTAINS[c] 'anemia'");

  const vivaxPatientIds = new Set(vivaxDiagnoses.map(d => d.visit[0].patient[0]._id));
  const anemiaPatientIds = new Set(anemiaDiagnoses.map(d => d.visit[0].patient[0]._id));
  const bothPatientIds = new Set([...vivaxPatientIds].filter(x => anemiaPatientIds.has(x)));

  const rowData = [
    ...vivaxDiagnoses,
    ...anemiaDiagnoses
  ]
    .filter(d => bothPatientIds.has(d.visit[0].patient[0]._id))
    .map(d => ({
      ...formatPatientInfo(d.visit[0].patient[0]),
      diagnosis: d.diagnosis.name,
      date: d.date,
    }));

  return {
    headers: ['id', 'name', 'village', 'diagnosis', 'date'],
    rowData,
  };
};

const reports = {
  numberOfVisitsReport,
  returnVivaxReport,
  diagnosesByVillageReport,
  anemiaVivaxCodiagnosesReport,
  visitsReport,
};

const tabulate = ({ headers, rowData }) => ([
  headers,
  ...rowData.map(row => headers.map(h => row[h]))
]);

const writeToExcel = async (path, data) => {
  const sheet = XLSX.utils.aoa_to_sheet(tabulate(data));

  const book = new XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'values');

  XLSX.writeFile(book, path);
};

export const generateReport = async (db, reportName, userParams) => {
  const report = reports[reportName];
  if(!report) {
    throw new Error("No such report");
  }

  const params = { 
    startDate: moment(userParams.endDate).subtract(1, 'month').toDate(),
    endDate: moment().toDate(),
    ...userParams,
  };

  const data = await report(db, params);

  const date = moment().format('YYYY-MM-DD');
  const filename = `${date}_${reportName}.xlsx`;

  const workbook = await writeToExcel(filename, data);

  return {};
};
