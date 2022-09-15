import XLSX from 'xlsx';
import React, { useCallback, useEffect } from 'react';
import { subMonths } from 'date-fns';

import { ContentPane } from '../../components/ContentPane';
import { FormGrid } from '../../components/FormGrid';
import { ButtonRow } from '../../components/ButtonRow';
import { Button } from '../../components/Button';
import { Form, Field, TextField, DateField, SelectInput } from '../../components/Field';

import { connectApi } from '../../api';

export { ReportGenerator } from './ReportGenerator';

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

  return new Promise((resolve, reject) => {
    XLSX.writeFileAsync(path, book, null, err => {
      if (err) {
        reject(err);
      } else {
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

  useEffect(() => {
    (async () => {
      const reports = await fetchAvailableReports();
      setAvailableReports(reports);
    })();
  }, [fetchAvailableReports]);

  const onReportSelected = React.useCallback(
    event => {
      const report = availableReports.find(r => r.id === event.target.value) || null;
      setCurrentReport(report);
      setIsDownloading(false);
      setError(null);
    },
    [availableReports],
  );

  const onWrite = useCallback(
    async params => {
      try {
        // TODO
        // const path = await showFileDialog(xlsxFilters, '');
        const path = '';

        if (!path) return;
        const minWait = new Promise(resolve => setTimeout(resolve, 1000));
        setIsDownloading(true);
        setError(null);
        const data = await fetchReportData(currentReport.id, params);

        await writeToExcel(path, data);
        await minWait;
        setIsDownloading(false);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        setError(e);
        setIsDownloading(false);
      }
    },
    [currentReport.id, fetchReportData],
  );

  const renderParamsForm = useCallback(
    ({ submitForm }) => {
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
            <Button
              onClick={submitForm}
              variant="contained"
              color="primary"
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </Button>
          </ButtonRow>
        </FormGrid>
      );
    },
    [currentReport.parameters, isDownloading],
  );

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
            endDate: new Date(),
            startDate: subMonths(new Date(), 1),
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
