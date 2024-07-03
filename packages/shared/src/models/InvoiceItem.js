import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { Model } from './Model';
import { dateType } from './dateTimeTypes';

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
          allowNull: true,
        },
        productPrice: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        productCode: {
          type: DataTypes.STRING,
          allowNull: true,
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

  addVirtualFields() {
    this.product = this.product.addVirtualFields();
    this.dataValues.productName = this.productName ?? this.product?.name;
    this.dataValues.productPrice = this.productPrice ?? this.product?.price;
    this.dataValues.productCode = this.productCode ?? this.product?.code;
    return this;
  }
}
