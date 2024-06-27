import React, { Children, cloneElement, isValidElement } from 'react';
import ReactDOMServer from 'react-dom/server';
import GetAppIcon from '@material-ui/icons/GetApp';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import cheerio from 'cheerio';
import * as XLSX from 'xlsx';

import { saveFile } from '../../utils/fileSystemAccess';
import { useTranslation } from '../../contexts/Translation';
import { GreyOutlinedButton } from '../Button';
import { TranslatedText } from '../Translation/TranslatedText';

/**
 * Recursive mapper for normalising descendant {@link TranslatedText} elements into translated
 * primitive strings.
 *
 * @privateRemarks Cheerio doesn’t like rendering {@link TranslatedText} elements, because it uses
 * the {@link useTranslation} hook under the hood.
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

export function DownloadDataButton({ exportName, columns, data }) {
  const { getTranslation } = useTranslation();
  const stringifyIfIsTranslatedText = element => {
    if (!isValidElement(element) || element.type !== TranslatedText) return element;

    const { stringId, fallback, replacements, uppercase, lowercase } = element.props;
    return getTranslation(
      stringId,
      fallback?.split('\\n').join('\n'),
      replacements,
      uppercase,
      lowercase,
    );
  };

  const getHeaderValue = ({ key, title }) => {
    if (!title) {
      return key;
    }
    if (typeof title === 'string') {
      return title;
    }
    if (typeof title === 'object') {
      if (isValidElement(title)) {
        return cheerio
          .load(
            ReactDOMServer.renderToString(normalizeRecursively(title, stringifyIfIsTranslatedText)),
          )
          .text();
      }
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
              const value = await c.asyncExportAccessor(d);
              dx[headerValue] = value;
              return;
            }

            if (c.accessor) {
              const value = c.accessor(d);
              if (typeof value === 'object') {
                if (isValidElement(value)) {
                  dx[headerValue] = cheerio
                    .load(
                      ReactDOMServer.renderToString(
                        normalizeRecursively(value, stringifyIfIsTranslatedText),
                      ),
                    )
                    .text(); // render react element and get the text value with cheerio
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
