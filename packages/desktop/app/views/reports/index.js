import XLSX from 'xlsx';
import React from 'react';
import moment from 'moment';

import { ContentPane } from 'desktop/app/components/ContentPane';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { showFileDialog } from 'desktop/app/components/SaveFileButton';
import { ButtonRow } from 'desktop/app/components/ButtonRow';
import { FormSeparatorLine } from 'desktop/app/components/FormSeparatorLine';
import { Button } from 'desktop/app/components/Button';
import {
  Form,
  Field,
  SelectField,
  CheckField,
  AutocompleteField,
  DateField,
  SelectInput,
} from 'desktop/app/components/Field';

import { connectApi } from 'desktop/app/api';

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

const DumbReportScreen = React.memo(({ fetchAvailableReports, fetchReportData }) => {
  const [currentReport, setCurrentReport] = React.useState(null);
  const [availableReports, setAvailableReports] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const reports = await fetchAvailableReports();
      setAvailableReports(reports);
    })();
  }, []);

  const onReportSelected = React.useCallback(
    event => {
      const report = availableReports.find(r => r.id === event.target.value) || null;
      setCurrentReport(report);
    },
    [availableReports],
  );

  const onWrite = React.useCallback(async params => {
    try {
      const data = await fetchReportData(currentReport.id, params);
      const path = await showFileDialog(xlsxFilters, '');

      return writeToExcel(path, data);
    } catch(e) {
      console.error(e);
      console.log(currentReport, params);
    }
  });

  const renderParamsForm = React.useCallback(({ submitForm }) => (
    <FormGrid>
      <Field
        name="startDate"
        label="Start date"
        component={DateField}
      />
      <Field
        name="endDate"
        label="End date"
        component={DateField}
      />
      <ButtonRow>
        <Button type="submit" variant="contained" color="primary">Download</Button>
      </ButtonRow>
    </FormGrid>
  ));

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
      </FormGrid>
      { currentReport 
        && <Form
          render={renderParamsForm}
          initialValues={{
            endDate: moment().toDate(),
            startDate: moment().subtract(1, 'month').toDate(),
          }}
          onSubmit={onWrite}
        />
      }
    </ContentPane>
  );
});

export const ReportScreen = connectApi(api => ({
  fetchAvailableReports: () => api.get('report'),
  fetchReportData: (reportId, params) => api.get(`report/${reportId}`, params),
}))(DumbReportScreen);
