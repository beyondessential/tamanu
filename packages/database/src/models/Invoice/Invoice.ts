import { DataTypes } from 'sequelize';
import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
} from '@tamanu/constants';
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../../types/model';
import type { Procedure } from '../Procedure';
import type { InvoiceProduct } from './InvoiceProduct';

export class Invoice extends Model {
  declare id: string;
  declare displayId: string;
  declare date: string;
  declare status: string;
  declare patientPaymentStatus: string;
  declare insurerPaymentStatus: string;
  declare encounterId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        displayId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        date: dateTimeType('date', {
          allowNull: false,
        }),
        status: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        patientPaymentStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: INVOICE_PATIENT_PAYMENT_STATUSES.UNPAID,
        },
        insurerPaymentStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: INVOICE_INSURER_PAYMENT_STATUSES.UNPAID,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.hasOne(models.InvoiceDiscount, {
      foreignKey: 'invoiceId',
      as: 'discount',
    });

    this.hasMany(models.InvoiceInsurer, {
      foreignKey: 'invoiceId',
      as: 'insurers',
    });

    this.hasMany(models.InvoiceItem, {
      foreignKey: 'invoiceId',
      as: 'items',
    });

    this.hasMany(models.InvoicePayment, {
      foreignKey: 'invoiceId',
      as: 'payments',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }

  static getFullReferenceAssociations(invoicePriceListId?: string) {
    const { models } = this.sequelize;

    return [
      'encounter',
      {
        model: models.InvoiceDiscount,
        as: 'discount',
        include: [{ model: models.User, as: 'appliedByUser', attributes: ['displayName'] }],
      },
      {
        model: models.InvoiceInsurer,
        as: 'insurers',
        include: [
          {
            model: models.ReferenceData,
            as: 'insurer',
          },
        ],
      },
      {
        model: models.InvoiceItem,
        as: 'items',
        include: models.InvoiceItem.getListReferenceAssociations(models, invoicePriceListId),
      },
      {
        model: models.InvoicePayment,
        as: 'payments',
        include: models.InvoicePayment.getListReferenceAssociations(models),
      },
    ];
  }

  private static async getInProgressInvoiceForEncounter(
    encounterId: string,
  ): Promise<Invoice | null> {
    const invoices = await this.findAll({
      where: {
        encounterId,
        status: INVOICE_STATUSES.IN_PROGRESS,
      },
    });

    if (invoices.length === 0) {
      return null; // No in progress invoice for encounter
    }

    if (invoices.length > 1) {
      throw new Error(`Multiple in progress invoices found for encounter: ${encounterId}`);
    }

    return invoices[0]!;
  }

  static async addItemToInvoice(
    newItem: Procedure,
    encounterId: string,
    invoiceProduct: InvoiceProduct,
    orderedByUserId: string = SYSTEM_USER_UUID,
  ) {
    const invoice = await this.getInProgressInvoiceForEncounter(encounterId);

    if (!invoice) {
      return;
    }

    await this.sequelize.models.InvoiceItem.create({
      invoiceId: invoice.id,
      sourceRecordType: newItem.getModelName(),
      sourceRecordId: newItem.id,
      productId: invoiceProduct.id,
      orderedByUserId,
      orderDate: new Date(),
      quantity: 1,
      productDiscountable: invoiceProduct.discountable,
    });
  }

  static async removeItemFromInvoice(removedItem: Procedure, encounterId: string) {
    const invoice = await this.getInProgressInvoiceForEncounter(encounterId);

    if (!invoice) {
      return;
    }

    await this.sequelize.models.InvoiceItem.destroy({
      where: {
        invoiceId: invoice.id,
        sourceRecordType: removedItem.getModelName(),
        sourceRecordId: removedItem.id,
      },
    });
  }
}
