import { DataTypes, literal, Op } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
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
  declare productNameFinal?: string;
  declare manualEntryPrice?: number;
  declare priceFinal?: number;
  declare productCodeFinal?: string;
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
        productNameFinal: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        manualEntryPrice: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        priceFinal: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        productCodeFinal: {
          type: DataTypes.STRING,
          allowNull: true,
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

    this.hasMany(models.InvoiceItemFinalisedInsurance, {
      foreignKey: 'invoiceItemId',
      as: 'finalisedInsurances',
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

  static getListReferenceAssociations(
    models: Models,
    invoicePriceListId?: string,
    tableAlias: string = 'InvoiceItem',
  ) {
    // Validate tableAlias against allow-list to prevent SQL injection
    const allowedAliases = ['InvoiceItem', 'items'];
    if (!allowedAliases.includes(tableAlias)) {
      throw new Error(
        `Invalid table alias: ${tableAlias}. Must be one of: ${allowedAliases.join(', ')}`,
      );
    }

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
      {
        model: models.InvoiceInsurancePlanItem,
        as: 'invoiceInsurancePlanItems',
        required: false,
        where: {
          invoiceInsurancePlanId: {
            [Op.in]: literal(`(
              SELECT iip."invoice_insurance_plan_id"
              FROM "invoices_invoice_insurance_plans" iip
              WHERE iip."invoice_id" = "${tableAlias}"."invoice_id"
                AND iip."deleted_at" IS NULL
            )`),
          },
        },
      },
    ];

    if (invoicePriceListId) {
      productInclude.push({
        model: models.InvoicePriceListItem,
        where: { invoicePriceListId, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
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
      { model: models.InvoiceItemFinalisedInsurance, as: 'finalisedInsurances' },
    ];
  }
}
