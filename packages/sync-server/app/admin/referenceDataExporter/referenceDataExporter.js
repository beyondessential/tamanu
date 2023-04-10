import xlsx from 'xlsx';
import { REFERENCE_TYPE_VALUES } from 'shared/constants';
import { startCase } from 'lodash';

function writeExcelFile(sheets) {
  const workbook = xlsx.utils.book_new();
  sheets.forEach(sheet => {
    const worksheet = xlsx.utils.aoa_to_sheet(sheet.data);
    xlsx.utils.book_append_sheet(workbook, worksheet, sheet.name);
  });
  const filename = `./export-${Date.now()}.xlsx`;
  xlsx.writeFile(workbook, filename);
  return filename;
}

const METADATA_COLUMNS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
  'updatedAtByField',
  'visibilityStatus',
];

const CUSTOM_TAB_NAME = {
  patientFieldDefinitionCategory: 'patientFieldDefinitionCategory',
};

const HIDDEN_COLUMNS_PER_MODEL_NAME = {
  ReferenceData: ['type'],
};

const getTabName = dataType => {
  return CUSTOM_TAB_NAME[dataType] || startCase(dataType);
};

const dataTypeToModelNameAndWhere = dataType => {
  if (REFERENCE_TYPE_VALUES.includes(dataType)) {
    return { modelName: 'ReferenceData', where: { type: dataType } };
  }
  if (dataType === 'diagnosis') {
    return { modelName: 'ReferenceData', where: { type: 'icd10' } };
  }
  return { modelName: dataType.charAt(0).toUpperCase() + dataType.slice(1), where: {} };
};

async function buildSheetDataForDataType(models, dataType) {
  const { modelName, where } = dataTypeToModelNameAndWhere(dataType);

  const data = await models[modelName].findAll({ where });
  if (!data || data.length === 0) {
    return [];
  }
  const headers = Object.keys(data[0].dataValues).filter(
    header =>
      !METADATA_COLUMNS.includes(header) &&
      !(HIDDEN_COLUMNS_PER_MODEL_NAME[modelName] || []).includes(header),
  );
  return [headers, ...data.map(row => headers.map(header => row[header]))];
}

export async function referenceDataExporter(models, includedDataTypes = {}) {
  const sheets = await Promise.all(
    Object.values(includedDataTypes).map(async dataType => {
      const data = await buildSheetDataForDataType(models, dataType);
      return {
        name: getTabName(dataType),
        data,
      };
    }),
  );
  return writeExcelFile(sheets);
}
