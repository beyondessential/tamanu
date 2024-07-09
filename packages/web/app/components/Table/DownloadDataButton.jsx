import React, { Children, cloneElement, isValidElement } from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import * as XLSX from 'xlsx';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';

import { ApiContext, useApi } from '../../api';
import { saveFile } from '../../utils/fileSystemAccess';
import { TranslationProvider } from '../../contexts/Translation';
import { GreyOutlinedButton } from '../Button';
import { isTranslatedText, TranslatedText } from '../Translation';

/**
 * Recursive mapper for transforming leaf nodes in a DOM tree. Used here to explicitly wrap
 * {@link TranslatedText} elements (and its derivatives) in the context providers needed to render
 * it into a translated primitive string.
 *
 * Based on: https://github.com/tatethurston/react-itertools/blob/main/src/map/index.ts. Used under
 * MIT licence.
 */
const normalizeRecursively = (element, normalizeFn) => {
  if (!isValidElement(element)) return element;

  const { children } = element.props;
  if (!children) return normalizeFn(element);

  return cloneElement(element, {
    children: Children.map(children, child => normalizeRecursively(child, normalizeFn)),
  });
};

const renderToString = element => {
  if (!isValidElement(element)) {
    throw new Error('`renderToString` has been called with an invalid element.');
  }

  const div = document.createElement('div');
  const root = createRoot(div);
  flushSync(() => {
    root.render(element); // Force DOM update before reading innerHTML
  });
  const renderedString = div.innerText;
  root.unmount();
  return renderedString;
};

export function DownloadDataButton({ exportName, columns, data }) {
  const queryClient = useQueryClient();
  const api = useApi();

  /**
   * If the input is a {@link TranslatedText} element (or one of its derivatives), explicitly wraps
   * it in a {@link TranslationProvider} (and its dependents). This is a workaround for the case
   * where a {@link TranslatedText} is rendered into a string for export, which happens in a
   * “headless” React root node, outside the context providers defined in `Root.jsx`.
   */
  const contextualizeIfIsTranslatedText = element => {
    if (!isTranslatedText(element)) return element;
    return (
      <QueryClientProvider client={queryClient}>
        <ApiContext.Provider value={api}>
          <TranslationProvider>{element}</TranslationProvider>
        </ApiContext.Provider>
      </QueryClientProvider>
    );
  };

  const getHeaderValue = ({ key, title }) => {
    if (!title) return key;
    if (typeof title === 'string') return title;
    if (isValidElement(title)) {
      const normalizedElement = normalizeRecursively(title, contextualizeIfIsTranslatedText);
      return renderToString(normalizedElement);
    }

    return key;
  };

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
              dx[headerValue] = await c.asyncExportAccessor(d);
              return;
            }

            if (c.accessor) {
              const value = c.accessor(d);
              if (typeof value === 'object') {
                if (isValidElement(value)) {
                  const normalizedElement = normalizeRecursively(
                    value,
                    contextualizeIfIsTranslatedText,
                  );
                  dx[headerValue] = renderToString(normalizedElement);
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

    const xlsxDataArray = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    await saveFile({
      defaultFileName: `${exportName}-${getCurrentDateString()}`,
      data: xlsxDataArray,
      extension: 'xlsx',
    });
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
