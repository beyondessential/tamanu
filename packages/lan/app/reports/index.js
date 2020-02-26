import XLSX from 'xlsx';
import moment from 'moment';

const formatPatientInfo = p => ({
  name: [p.firstName, p.culturalName, p.lastName].filter(x => x).join(' '),
  village: p.village && p.village.name,
  id: p.displayId
});

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

const returnVivaxReport = async (db, params) => {

};

const diagnosesByVillageReport = async (db, params) => {
  const { village } = params;

};

const anemiaVivaxCodiagnosesReport = async (db, params) => {
  const diagnoses = db.objects('patientDiagnosis')
    .filtered("diagnosis.name CONTAINS[c] 'vivax'");

  const rowData = diagnoses.map(d => ({
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
};

const writeToExcel = async (path, { headers, rowData }) => {
  const rows = rowData.map(row => headers.map(h => row[h]));
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const book = new XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'values');

  XLSX.writeFile(book, path);
};

export const generateReport = async (db, name, params) => {
  const reportName = 'anemiaVivaxCodiagnosesReport';

  const report = reports[reportName];
  const data = await report(db);

  const date = moment().format('YYYY-MM-DD');
  const filename = `${date}_${reportName}.xlsx`;

  const workbook = await writeToExcel(filename, data);

  return {};
};
