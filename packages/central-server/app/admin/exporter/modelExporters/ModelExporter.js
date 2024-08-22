import { startCase } from 'lodash';
import { Model } from '@tamanu/shared/models/Model';

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

  formatedCell(header, value) {
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
    return Object.keys(data instanceof Model ? data[0].dataValues : data[0]);
  }

  customHiddenColumns() {
    return [];
  }

  hiddenColumns() {
    return [...METADATA_COLUMNS, ...this.customHiddenColumns()];
  }
}
