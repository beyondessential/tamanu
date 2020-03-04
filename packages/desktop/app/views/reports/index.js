import XLSX from 'xlsx';
import React from 'react';

import { ContentPane } from 'desktop/app/components/ContentPane';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { SaveFileButton } from 'desktop/app/components/SaveFileButton';
import {
  Form,
  Field,
  SelectField,
  CheckField,
  AutocompleteField,
  DateField,
  SelectInput,
} from 'desktop/app/components/Field';

const DEBUG_REPORTS = [
  {
    id: 'diagnosesByVillageReport',
    title: 'Diagnoses by village',
    parameters: {
      diagnosis: 'string',
      startDate: 'date',
      endDate: 'date',
    },
  },
  {
    id: 'anemiaVivaxCodiagnosesReport',
    title: 'Codiagnoses of anemia and malaria (vivax)',
    parameters: {
      startDate: 'date',
      endDate: 'date',
    },
  },
  {
    id: 'visitsReport',
    title: 'Number of visits (debug)',
    parameters: {},
  },
];

const tabulate = ({ headers, rowData }) => [
  headers,
  ...rowData.map(row => headers.map(h => row[h])),
];

const writeToExcel = async (path, { metadata, data }) => {
  const book = XLSX.utils.book_new();

  const sheet = XLSX.utils.aoa_to_sheet(tabulate(data));
  XLSX.utils.book_append_sheet(book, sheet, 'values');

  const metasheet = XLSX.utils.aoa_to_sheet(Object.entries(metadata));
  XLSX.utils.book_append_sheet(book, metasheet, 'metadata');

  XLSX.writeFile(book, path);
};

const xlsxFilters = [{ name: 'Excel spreadsheet (.xlsx)', extensions: ['xlsx'] }];

const DEBUG_REPORT_DATA = {
  metadata: {
    report: 'Returning cases of malaira (vivax)',
    generated: '2020-03-04T05:51:42.696Z',
  },
  data: {
    headers: ['id', 'name', 'village', 'diagnosis', 'lastDiagnosed'],
    rowData: [
      {
        name: 'Victoria Salerno Pacini',
        village: 'Auki',
        id: 'ZFWA900716',
        diagnosis: 'Malaria, vivax',
        date: '2020-03-02T04:54:00.261Z',
      },
    ],
  },
};

export const ReportScreen = React.memo(() => {
  const [currentReport, setCurrentReport] = React.useState(null);
  const [availableReports, setAvailableReports] = React.useState([]);

  React.useEffect(() => {
    setAvailableReports(DEBUG_REPORTS);
  }, []);

  const onReportSelected = React.useCallback(
    event => {
      const report = availableReports.find(r => r.id === event.target.value) || null;
      setCurrentReport(report);
    },
    [availableReports],
  );

  const write = React.useCallback(async path => {
    const data = await DEBUG_REPORT_DATA;

    return writeToExcel(path, data);
  });

  return (
    <ContentPane>
      <FormGrid>
        <SelectInput
          label="Report"
          options={availableReports.map(r => ({
            label: r.title,
            value: r.id,
          }))}
          value={currentReport && currentReport.id}
          onChange={onReportSelected}
        />
        <pre>{JSON.stringify(currentReport, null, 2)}</pre>
      </FormGrid>
      <SaveFileButton filters={xlsxFilters} writeFunction={write} />
    </ContentPane>
  );
});
