import { REFERENCE_TYPE_VALUES } from 'shared/constants';
import { startCase } from 'lodash';
import { writeExcelFile } from './excelUtils';

const METADATA_COLUMNS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
  'updatedAtByField',
  'visibilityStatus',
];

const CUSTOM_TAB_NAME = {
  patientFieldDefinitionCategory: 'Patient Field Def Category',
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

function isDate(dateString) {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString || !dateString.match(regEx)) return false; // Invalid format
  const d = new Date(dateString);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === dateString;
}

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
  return [
    headers,
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return isDate(value) ? new Date(value) : value;
      }),
    ),
  ];
}

export async function referenceDataExporter(models, includedDataTypes = {}, fileName = '') {
  const sheets = await Promise.all(
    Object.values(includedDataTypes).map(async dataType => {
      const data = await buildSheetDataForDataType(models, dataType);
      return {
        name: getTabName(dataType),
        data,
      };
    }),
  );
  return writeExcelFile(sheets, fileName);
}
