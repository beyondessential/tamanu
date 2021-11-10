import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class InvoiceLineType extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        item_id: Sequelize.STRING,
        item_type: Sequelize.STRING,
        name: Sequelize.TEXT,
        price: Sequelize.STRING,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'item_id',
      as: 'procedureType',
      constraint: false,
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'item_id',
      as: 'imagingType',
      constraint: false,
    });

    this.belongsTo(models.LabTestType, {
      foreignKey: 'item_id',
      as: 'labTestType',
      constraint: false,
    });
  }

  static getFullLinkedItemsInclude(models) {
    return [
      {
        model: models.ReferenceData,
        on: {
          itemId: Sequelize.where(
            Sequelize.col('invoiceLineType->procedureType.id'),
            '=',
            Sequelize.col('invoiceLineType.item_id'),
          ),
          itemType: Sequelize.where(
            Sequelize.col('invoiceLineType->procedureType.type'),
            '=',
            'procedureType',
          ),
        },
        as: 'procedureType',
      },
      {
        model: models.ReferenceData,
        on: {
          itemId: Sequelize.where(
            Sequelize.col('invoiceLineType->imagingType.id'),
            '=',
            Sequelize.col('invoiceLineType.item_id'),
          ),
          itemType: Sequelize.where(
            Sequelize.col('invoiceLineType->imagingType.type'),
            '=',
            'imagingType',
          ),
        },
        as: 'imagingType',
      },
      {
        model: models.LabTestType,
        on: {
          itemId: Sequelize.where(
            Sequelize.col('invoiceLineType->labTestType.id'),
            '=',
            Sequelize.col('invoiceLineType.item_id'),
          ),
          itemType: Sequelize.where(Sequelize.col('invoiceLineType.item_type'), '=', 'labTestType'),
        },
        as: 'labTestType',
      },
    ];
  }
}
