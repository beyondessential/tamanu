import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '../constants';
import { Model } from './Model';

export class InvoiceLineType extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        itemId: Sequelize.STRING,
        itemType: Sequelize.STRING,
        name: Sequelize.TEXT,
        price: Sequelize.DECIMAL,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'itemId',
      as: 'procedureType',
      constraints: false,
    });
    this.belongsTo(models.LabTestType, {
      foreignKey: 'itemId',
      as: 'labTestType',
      constraints: false,
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
