import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { dateType, type InitOptions, type Models } from '../../types/model';
import {
  buildEncounterLinkedLookupJoins,
  buildEncounterLinkedLookupSelect,
} from '../../sync/buildEncounterLinkedLookupFilter';

export class InvoiceItem extends Model {
  declare id: string;
  declare orderDate: string;
  declare productId?: string;
  declare quantity: number;
  declare note?: string;
  declare sourceRecordType?: string;
  declare sourceRecordId?: string;
  declare productName?: string;
  declare productPrice?: number;
  declare productCode?: string;
  declare productDiscountable: boolean;
  declare invoiceId?: string;
  declare orderedByUserId?: string;

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
        sourceRecordType: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        sourceRecordId: {
          type: DataTypes.STRING,
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

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterLinkedLookupSelect(this),
      joins: buildEncounterLinkedLookupJoins(this, ['invoices', 'encounters']),
    };
  }

  static getListReferenceAssociations(models: Models, invoicePriceListId?: string) {
    const productInclude: Record<string, any>[] = [
      {
        model: models.ReferenceData,
        as: 'sourceRefDataRecord',
        attributes: ['code', 'type'],
      },
      {
        model: models.LabTestType,
        as: 'sourceLabTestTypeRecord',
        attributes: ['code'],
      },
      {
        model: models.LabTestPanel,
        as: 'sourceLabTestPanelRecord',
        attributes: ['code'],
      },
    ];

    if (invoicePriceListId) {
      productInclude.push({
        model: models.InvoicePriceListItem,
        where: { invoicePriceListId },
        as: 'invoicePriceListItem',
        attributes: ['price', 'invoicePriceListId'],
        required: false,
      });
    }

    return [
      {
        model: models.InvoiceProduct,
        as: 'product',
        include: productInclude,
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
