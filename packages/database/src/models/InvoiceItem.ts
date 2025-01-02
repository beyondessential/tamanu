import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import {
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync/buildEncounterLinkedSyncFilter';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import { dateType, type InitOptions, type Models } from '../types/model';

export class InvoiceItem extends Model {
  id!: string;
  orderDate!: string;
  productId?: string;
  quantity!: number;
  note?: string;
  sourceId?: string;
  productName!: string;
  productPrice!: number;
  productCode!: string;
  productDiscountable!: boolean;
  invoiceId?: string;
  orderedByUserId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
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
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
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

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
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
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'invoices', 'encounters']),
    };
  }

  static getListReferenceAssociations(models: Models) {
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
