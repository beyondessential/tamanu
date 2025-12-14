import { DataTypes } from 'sequelize';
import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
  AUTOMATIC_INVOICE_CREATION_EXCLUDED_ENCOUNTER_TYPES,
} from '@tamanu/constants';
import { Model } from '../Model';
import { buildEncounterLinkedSyncFilter } from '../../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../../types/model';
import type { Procedure } from '../Procedure';
import type { InvoiceProduct } from './InvoiceProduct';
import type { ImagingRequest } from 'models/ImagingRequest';
import type { LabTestPanelRequest } from 'models/LabTestPanelRequest';
import type { LabTest } from 'models/LabTest';
import type { ImagingRequestArea } from 'models/ImagingRequestArea';
import type { ReadSettings } from '@tamanu/settings';
import { generateInvoiceDisplayId } from '@tamanu/utils/generateInvoiceDisplayId';

type InvoiceItemSourceRecord =
  | Procedure
  | LabTestPanelRequest
  | LabTest
  | ImagingRequestArea
  | ImagingRequest;

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

    this.hasMany(models.InvoicesInvoiceInsurancePlan, {
      foreignKey: 'invoiceId',
      as: 'invoiceInsurancePlans',
    });

    this.belongsToMany(models.InvoiceInsurancePlan, {
      through: models.InvoicesInvoiceInsurancePlan,
      foreignKey: 'invoiceId',
      otherKey: 'invoiceInsurancePlanId',
      as: 'insurancePlans',
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
        model: models.InvoiceItem,
        as: 'items',
        include: models.InvoiceItem.getListReferenceAssociations(
          models,
          invoicePriceListId,
          'items',
        ),
      },
      {
        model: models.InvoicePayment,
        as: 'payments',
        include: models.InvoicePayment.getListReferenceAssociations(models),
      },
      {
        model: models.InvoiceInsurancePlan,
        as: 'insurancePlans',
      },
    ];
  }

  public static async getInProgressInvoiceForEncounter(
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
    newItem: InvoiceItemSourceRecord,
    encounterId: string,
    invoiceProduct: InvoiceProduct,
    orderedByUserId: string = SYSTEM_USER_UUID,
    note?: string,
  ) {
    const invoice = await this.getInProgressInvoiceForEncounter(encounterId);

    if (!invoice) {
      return;
    }

    // Confirm price list exists
    const invoicePriceListId = await this.sequelize.models.InvoicePriceList.getIdForPatientEncounter(encounterId);
    if (!invoicePriceListId) {
      return;
    }

    // Confirm invoice product is not configured to be hidden for this price list
    const invoicePriceListItem = await this.sequelize.models.InvoicePriceListItem.findOne({
      where: {
        invoicePriceListId,
        invoiceProductId: invoiceProduct.id,
        isHidden: false,
      },
    });
    if (!invoicePriceListItem) {
      return;
    }

    await this.sequelize.models.InvoiceItem.upsert(
      {
        invoiceId: invoice.id,
        sourceRecordType: newItem.getModelName(),
        sourceRecordId: newItem.id,
        productId: invoiceProduct.id,
        orderedByUserId,
        orderDate: new Date(),
        quantity: 1,
        note,
        deletedAt: null, // Ensure we restore the item if it already exists
      },
      {
        conflictFields: ['invoice_id', 'source_record_type', 'source_record_id'],
      },
    );
  }

  static async removeItemFromInvoice(
    removedItemSource: InvoiceItemSourceRecord,
    encounterId: string,
  ) {
    const invoice = await this.getInProgressInvoiceForEncounter(encounterId);

    if (!invoice) {
      return;
    }

    await this.sequelize.models.InvoiceItem.destroy({
      where: {
        invoiceId: invoice.id,
        sourceRecordType: removedItemSource.getModelName(),
        sourceRecordId: removedItemSource.id,
      },
    });
  }

  static async automaticallyCreateForEncounter(
    encounterId: string,
    encounterType: string,
    date: string,
    settings: ReadSettings,
  ) {
    const isInvoicingEnabled = await settings?.get('features.invoicing.enabled');
    const isValidEncounterType =
      !AUTOMATIC_INVOICE_CREATION_EXCLUDED_ENCOUNTER_TYPES.includes(encounterType);
    if (!isInvoicingEnabled || !isValidEncounterType) {
      return null;
    }

    return await this.create({
      displayId: generateInvoiceDisplayId(),
      status: INVOICE_STATUSES.IN_PROGRESS,
      date,
      encounterId,
    });
  }
}
