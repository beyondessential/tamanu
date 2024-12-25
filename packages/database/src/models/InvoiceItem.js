import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { buildEncounterLinkedSyncFilter, buildEncounterLinkedSyncFilterJoins } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { dateType } from './dateTimeTypes';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';

export class InvoiceItem extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        orderDate: dateType('orderDate', {
          allowNull: false,
        }),
        productId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        note: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sourceId: {
          type: DataTypes.UUID,
          allowNull: true,
        },
        productName: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        productPrice: {
          type: DataTypes.DECIMAL,
          allowNull: false,
        },
        productCode: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        productDiscountable: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static initRelations(models) {
    this.belongsTo(models.Invoice, {
      foreignKey: 'invoiceId',
      as: 'invoice',
    });

    this.hasOne(models.InvoiceItemDiscount, {
      foreignKey: 'invoiceItemId',
      as: 'discount',
    });

    this.belongsTo(models.User, {
      foreignKey: 'orderedByUserId',
      as: 'orderedByUser',
    });

    this.belongsTo(models.InvoiceProduct, {
      foreignKey: 'productId',
      as: 'product',
    });
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'invoices', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        patientId: 'encounters.patient_id',
      }),
      joins: buildEncounterLinkedSyncFilterJoins([
        this.tableName,
        'invoices',
        'encounters',
      ]),
    };
  }

  static getListReferenceAssociations(models) {
    return [
      {
        model: models.InvoiceProduct,
        as: 'product',
        include: [
          {
            model: models.ReferenceData,
            as: 'referenceData',
            attributes: ['code', 'type'],
          },
          {
            model: models.LabTestType,
            as: 'labTestType',
            attributes: ['code'],
          },
        ],
      },
      {
        model: models.User,
        as: 'orderedByUser',
        attributes: ['displayName'],
      },
      {
        model: models.InvoiceItemDiscount,
        as: 'discount',
      },
    ];
  }
}
