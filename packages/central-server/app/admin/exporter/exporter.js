import { ReadSettings } from '@tamanu/settings';
import { promises as asyncFs } from 'fs';
// import config from 'config';
import { writeExcelFile } from './excelUtils';
import { createModelExporter } from './modelExporters/createModelExporter';

async function buildSheetDataForDataType(models, dataType) {
  const modelExporter = createModelExporter(models, dataType);
  const tabName = modelExporter.getTabName();
  const data = await modelExporter.getData();
  if (!data || data.length === 0) {
    return { tabName, data: [] };
  }

  const headers = modelExporter.getHeaders(data);
  return {
    tabName,
    data: [
      headers,
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          return modelExporter.formatedCell(header, value);
        }),
      ),
    ],
  };
}

async function validateFileSize(fileName, maxSizeInMb) {
  if (!fileName) {
    return;
  }
  const ONE_MEGABYTE_IN_BYTES = 1024 * 1024;
  const { size: fileSizeInBytes } = await asyncFs.stat(fileName);
  const maxSizeInBytes = maxSizeInMb * ONE_MEGABYTE_IN_BYTES;
  if (fileSizeInBytes > maxSizeInBytes) {
    throw new Error(
      `File exported exceeds configured maximum of ${maxSizeInMb}mb. Please try again with less data types.`,
    );
  }
}

export async function exporter(models, includedDataTypes = {}, fileName = '') {
  const sheets = await Promise.all(
    Object.values(includedDataTypes).map(async dataType => {
      const { data, tabName } = await buildSheetDataForDataType(models, dataType);
      return {
        name: tabName,
        data,
      };
    }),
  );
  const exportedFileName = writeExcelFile(sheets, fileName);

  const readSettings = new ReadSettings(models);
  // This is a temporary fix for limiting the exported file size.
  // TODO: Remove this validation as soon as we implement the download in chunks.
  const { maxFileSizeInMB } = await readSettings.get('export');
  await validateFileSize(exportedFileName, maxFileSizeInMB);
  return exportedFileName;
}
