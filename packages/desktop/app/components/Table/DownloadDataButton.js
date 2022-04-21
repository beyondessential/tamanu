import React, { isValidElement } from 'react';
import * as ReactDOM from 'react-dom';
import { Button } from '@material-ui/core';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import styled from 'styled-components';
import XLSX from 'xlsx';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { useElectron, DummyElectronProvider } from '../../contexts/Electron';

const PaddedDownloadIcon = styled(SaveAltIcon)`
  padding: 5px;
  font-size: 42px;
`;

// Create a dummy redux store, otherwise some components will throw an error
// that can't be catched.
const dummyStore = createStore(() => {});

/*
  Previously, we used ReactDOMServer.renderToString() but this brought
  problems with the app styling, with base styles being injected and
  overwriting our custom ones. To get around this and taking advantage
  of being run in the client, we can render directly to a DOM node and
  read the HTML from there.
*/
function getTextFromComponent(component) {
  // Create unattached node and render component inside it
  const container = document.createElement('div');
  ReactDOM.render(
    <Provider store={dummyStore}>
      <DummyElectronProvider>{component}</DummyElectronProvider>
    </Provider>,
    container,
  );

  // Extract the text from it
  const scrappedText = container.textContent;

  // Unmount the component to let the injected styles clean themselves
  ReactDOM.unmountComponentAtNode(container);
  return scrappedText;
}

function getHeaderValue(column) {
  if (!column.title) {
    return column.key;
  }
  if (typeof column.title === 'string') {
    return column.title;
  }
  if (typeof column.title === 'object') {
    if (isValidElement(column.title)) {
      return getTextFromComponent(column.title);
    }
  }
  return column.key;
}

export function DownloadDataButton({ exportName, columns, data }) {
  const { showSaveDialog, openPath } = useElectron();
  const onDownloadData = async () => {
    const header = columns.map(getHeaderValue);
    const rows = await Promise.all(
      data.map(async d => {
        const dx = {};
        await Promise.all(
          columns.map(async c => {
            const headerValue = getHeaderValue(c);
            if (c.asyncExportAccessor) {
              const value = await c.asyncExportAccessor(d);
              dx[headerValue] = value;
              return;
            }

            if (c.accessor) {
              const value = c.accessor(d);
              // Assume it's a react element
              if (typeof value === 'object') {
                if (isValidElement(value)) {
                  dx[headerValue] = getTextFromComponent(value);
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
    <Button onClick={onDownloadData} data-test-class="download-data-button">
      <PaddedDownloadIcon />
    </Button>
  );
}
