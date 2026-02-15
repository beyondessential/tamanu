import React, { isValidElement } from 'react';
import GetAppIcon from '@material-ui/icons/GetApp';
import * as XLSX from 'xlsx';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  ApiContext,
  TranslationContext,
  useTranslation,
  GreyOutlinedButton,
  useDateTime,
} from '@tamanu/ui-components';
import { useApi } from '../../api';
import { notifySuccess, renderToText } from '../../utils';
import { saveFile } from '../../utils/fileSystemAccess';
import { TranslatedText } from '../Translation';
import { ExportProvider } from '../../contexts/ExportContext';

export function DownloadDataButton({ exportName, columns, data, ExportButton }) {
  const { getCurrentDate } = useDateTime();
  const queryClient = useQueryClient();
  const api = useApi();
  const translationContext = useTranslation();
  const { getTranslation } = translationContext;

  const safelyRenderToText = element => {
    return renderToText(
      <ExportProvider isExporting={true}>
        <QueryClientProvider client={queryClient} data-testid="queryclientprovider-k086">
          <ApiContext.Provider value={api} data-testid="provider-72ic">
            <TranslationContext.Provider value={translationContext} data-testid="provider-c9xv">
              {element}
            </TranslationContext.Provider>
          </ApiContext.Provider>
        </QueryClientProvider>
      </ExportProvider>,
    );
  };

  const getHeaderValue = ({ key, title }) => {
    if (!title) return key;
    if (typeof title === 'string') return title;
    if (isValidElement(title)) return safelyRenderToText(title);

    return key;
  };

  const exportableColumnsWithOverrides = columns
    .filter(c => c.isExportable !== false)
    .map(c => {
      const { exportOverrides = {}, ...rest } = c;
      return { ...rest, ...exportOverrides };
    });

  const prepareData = async () => {
    const header = exportableColumnsWithOverrides.map(getHeaderValue);
    const rows = await Promise.all(
      data.map(async d => {
        const dx = {};
        await Promise.all(
          exportableColumnsWithOverrides.map(async (c, index) => {
            const headerValue = getHeaderValue(c);
            if (c.asyncExportAccessor) {
              dx[headerValue] = await c.asyncExportAccessor(d);
              return;
            }

            if (c.accessor) {
              const value = c.accessor(d);
              if (typeof value === 'object') {
                dx[headerValue] = isValidElement(value) ? safelyRenderToText(value) : d[c.key];
                return;
              }

              if (typeof value === 'string') {
                dx[headerValue] = value;
                return;
              }

              dx[headerValue] = 'Error: Could not parse accessor';
            }

            if (c.CellComponent) {
              const CellComponent = c.CellComponent;
              dx[headerValue] = safelyRenderToText(
                <CellComponent value={d[c.key]} data-testid={`cellcomponent-7u3b-${index}`} />,
              );
              return;
            }

            // Some columns have no accessor at all.
            dx[headerValue] = d[c.key];
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

    return XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  };

  const onDownloadData = async () => {
    await saveFile({
      defaultFileName: `${exportName}-${getCurrentDate()}`,
      getData: prepareData,
      extension: 'xlsx',
    });
    notifySuccess(
      getTranslation('document.notification.downloadSuccess', 'Successfully downloaded file'),
    );
  };

  return (
    <>
      {ExportButton ? (
        <ExportButton onClick={onDownloadData} />
      ) : (
        <GreyOutlinedButton
          onClick={onDownloadData}
          startIcon={<GetAppIcon data-testid="getappicon-bmce" />}
          data-test-class="download-data-button"
          data-testid="download-data-button"
        >
          <TranslatedText
            stringId="general.action.download"
            fallback="Download"
            data-testid="translatedtext-oycf"
          />
        </GreyOutlinedButton>
      )}
    </>
  );
}
