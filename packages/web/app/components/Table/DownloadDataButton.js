import React, { isValidElement } from 'react';
import ReactDOMServer from 'react-dom/server';
import GetAppIcon from '@material-ui/icons/GetApp';
import cheerio from 'cheerio';
import XLSX from 'xlsx';

import { GreyOutlinedButton } from '../Button';
import { useElectron } from '../../contexts/Electron';
import { TranslatedText } from '../Translation/TranslatedText';

function getHeaderValue(column) {
  if (!column.title) {
    return column.key;
  }
  if (typeof column.title === 'string') {
    return column.title;
  }
  if (typeof column.title === 'object') {
    if (isValidElement(column.title)) {
      return cheerio.load(ReactDOMServer.renderToString(column.title)).text();
    }
  }
  return column.key;
}

export function DownloadDataButton({ exportName, columns, data }) {
  const { showSaveDialog, openPath } = useElectron();
  const exportableColumnsWithOverrides = columns
    .filter(c => c.isExportable !== false)
    .map(c => {
      const { exportOverrides = {}, ...rest } = c;
      return { ...rest, ...exportOverrides };
    });
  const onDownloadData = async () => {
    const header = exportableColumnsWithOverrides.map(getHeaderValue);
    const rows = await Promise.all(
      data.map(async d => {
        const dx = {};
        await Promise.all(
          exportableColumnsWithOverrides.map(async c => {
            const headerValue = getHeaderValue(c);
            if (c.asyncExportAccessor) {
              const value = await c.asyncExportAccessor(d);
              dx[headerValue] = value;
              return;
            }

            if (c.accessor) {
              const value = c.accessor(d);
              // render react element and get the text value with cheerio
              if (typeof value === 'object') {
                if (isValidElement(value)) {
                  dx[headerValue] = cheerio.load(ReactDOMServer.renderToString(value)).text();
                } else {
                  dx[headerValue] = d[c.key];
                }
                return;
              }

              if (typeof value === 'string') {
                dx[headerValue] = value;
                return;
              }

              dx[headerValue] = 'Error: Could not parse accessor';
            } else {
              // Some columns have no accessor at all.
              dx[headerValue] = d[c.key];
            }
          }),
        );
        return dx;
      }),
    );

    const ws = XLSX.utils.json_to_sheet(rows, {
      header,
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, exportName);

    // show a file-save dialog and write the workbook
    const path = await showSaveDialog();
    if (path.canceled) return; // Dialog was cancelled - don't write file.
    XLSX.writeFile(wb, `${path.filePath}.xlsx`);
    openPath(`${path.filePath}.xlsx`);
  };

  return (
    <GreyOutlinedButton
      onClick={onDownloadData}
      data-test-class="download-data-button"
      startIcon={<GetAppIcon />}
    >
      <TranslatedText stringId="general.table.action.export" fallback="Export" />
    </GreyOutlinedButton>
  );
}
