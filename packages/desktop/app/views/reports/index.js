import XLSX from 'xlsx';
import React from 'react';
import moment from 'moment';

import { ContentPane } from 'desktop/app/components/ContentPane';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { showFileDialog } from 'desktop/app/utils/dialog';
import { ButtonRow } from 'desktop/app/components/ButtonRow';
import { Button } from 'desktop/app/components/Button';
import { Form, Field, TextField, DateField, SelectInput } from 'desktop/app/components/Field';

import { connectApi } from 'desktop/app/api';

const tabulate = ({ headers, rowData }) => [
  headers,
  ...rowData.map(row => headers.map(h => row[h])),
];

const writeToExcel = async (path, { metadata, data }) => {
  console.log("write start");
  const book = XLSX.utils.book_new();

  console.log("creating sheet");
  const sheet = XLSX.utils.aoa_to_sheet(tabulate(data));
  XLSX.utils.book_append_sheet(book, sheet, 'values');

  console.log("creating metadata");
  const metasheet = XLSX.utils.aoa_to_sheet(Object.entries(metadata));
  XLSX.utils.book_append_sheet(book, metasheet, 'metadata');

  return new Promise((resolve, reject) => {
    console.log("writing to ", path);
    XLSX.writeFileAsync(path, book, null, err => {
      console.log("writing to ", path);
      if (err) {
        console.log("could not write");
        reject(err);
      } else {
        console.log("finished writing");
        resolve();
      }
    });
  });
};

const xlsxFilters = [{ name: 'Excel spreadsheet (.xlsx)', extensions: ['xlsx'] }];

const DumbReportScreen = React.memo(({ fetchAvailableReports, fetchReportData }) => {
  const [currentReport, setCurrentReport] = React.useState(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [availableReports, setAvailableReports] = React.useState([]);
  const [error, setError] = React.useState(null);

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
      setIsDownloading(false);
      setError(null);
    },
    [availableReports],
  );

  const onWrite = React.useCallback(async params => {
    try {
      console.log("write start");
      const path = await showFileDialog(xlsxFilters, '');
      console.log("got path", path || "~~~ NONE ~~~");
      if (!path) return;
      console.log("write start");
      const minWait = new Promise(resolve => setTimeout(resolve, 1000));
      setIsDownloading(true);
      setError(null);
      console.log("fetch start");
      const data = await fetchReportData(currentReport.id, params);
      console.log("fetch ok");

      await writeToExcel(path, data);
      await minWait;
      setIsDownloading(false);
    } catch (e) {
      console.error(e);
      setError(e);
      setIsDownloading(false);
    }
  });

  const renderParamsForm = React.useCallback(({ submitForm }) => {
    const fields = currentReport.parameters.map(({ name, label, type }) => (
      <Field
        key={name}
        name={name}
        label={label}
        component={type === 'date' ? DateField : TextField}
        required
      />
    ));
    return (
      <FormGrid>
        {fields}
        <ButtonRow>
          <Button onClick={submitForm} variant="contained" color="primary" disabled={isDownloading}>
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
        </ButtonRow>
      </FormGrid>
    );
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
      </FormGrid>
      {currentReport && (
        <Form
          render={renderParamsForm}
          key={currentReport.id}
          initialValues={{
            endDate: moment().toDate(),
            startDate: moment()
              .subtract(1, 'month')
              .toDate(),
          }}
          onSubmit={onWrite}
        />
      )}
      {error && (
        <div>
          <div>An error was encountered while generating the report: </div>
          <div>{error.message === '500' ? 'Server error' : error.message}</div>
        </div>
      )}
    </ContentPane>
  );
});

export const ReportScreen = connectApi(api => ({
  fetchAvailableReports: () => api.get('report'),
  fetchReportData: (reportId, params) => api.get(`report/${reportId}`, params),
}))(DumbReportScreen);
