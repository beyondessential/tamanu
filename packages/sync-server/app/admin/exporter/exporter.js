import { writeExcelFile } from './excelUtils';
import { modelExporterFactory } from './modelExporters/factory';

async function buildSheetDataForDataType(models, dataType) {
  const modelExporter = modelExporterFactory(models, dataType);
  const data = await modelExporter.getData();
  const tabName = modelExporter.getTabName();
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
  return writeExcelFile(sheets, fileName);
}
