import { startCase } from 'lodash';
import { Model } from 'sequelize';

const METADATA_COLUMNS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'updatedAtSyncTick',
  'updatedAtByField',
];

export class ModelExporter {
  constructor({ models, sequelize }, dataType) {
    this.models = models;
    this.sequelize = sequelize;
    this.dataType = dataType;
  }

  customCellFormatter = {};

  async getData() {
    throw new Error('getData() method not implemented');
  }

  getHeaders(data) {
    return this.getHeadersFromData(data).filter(header => !this.hiddenColumns().includes(header));
  }

  getTabName() {
    return this.customTabName() || startCase(this.dataType);
  }

  formattedCell(header, value) {
    if (!value) {
      return value;
    }

    const formatter = this.customCellFormatter[header];
    if (formatter) {
      return formatter(value);
    }

    return value;
  }

  customTabName() {
    return null;
  }

  getHeadersFromData(data) {
    const allKeys = new Set();
    data.forEach(row => {
      const rowData = row instanceof Model ? row.dataValues : row;
      Object.keys(rowData).forEach(key => allKeys.add(key));
    });
    return Array.from(allKeys);
  }

  customHiddenColumns() {
    return [];
  }

  hiddenColumns() {
    return [...METADATA_COLUMNS, ...this.customHiddenColumns()];
  }
}
