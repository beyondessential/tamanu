import { DataTypes, Transaction } from 'sequelize';
import {
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_ITEMS_CATEGORIES,
  INVOICE_PATIENT_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  ENCOUNTER_FEE_CODES,
  PHARMACY_ENCOUNTER_FEE_CODE,
  REFERENCE_TYPES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
  AUTOMATIC_INVOICE_CREATION_EXCLUDED_ENCOUNTER_TYPES,
  ENCOUNTER_TYPES,
  type EncounterType,
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
import {
  getCurrentDateTimeString,
  instantToDateTimeStringInTimezone,
} from '@tamanu/utils/dateTime';
import { selectEncounterFeeCode, computeBedFeeChargeInstants } from '@tamanu/utils/invoice';
import type { Prescription } from 'models/Prescription';
import type { Encounter } from '../Encounter';
import type { Location } from '../Location';

type InvoiceItemSourceRecord =
  | Procedure
  | LabTestPanelRequest
  | LabTest
  | ImagingRequestArea
  | ImagingRequest
  | Prescription
  | Encounter
  | Location;

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

  static getFullReferenceAssociations(
    invoicePriceListId?: string,
    includeRefundingPayments?: boolean,
  ) {
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
        required: false,
        include: models.InvoicePayment.getListReferenceAssociations(models),
        ...(!includeRefundingPayments
          ? {
              where: {
                original_payment_id: null,
              },
            }
          : {}),
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

  private static normaliseInvoiceItemQuantity(quantity: unknown, fallback: number) {
    const n = Number(quantity);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.floor(n));
  }

  static async addItemToInvoice(
    newItem: InvoiceItemSourceRecord,
    encounterId: string,
    invoiceProduct: InvoiceProduct,
    orderedByUserId: string = SYSTEM_USER_UUID,
    options?: {
      quantity?: number;
      note?: string;
    },
  ) {
    const invoice = await this.getInProgressInvoiceForEncounter(encounterId);

    if (!invoice) {
      return;
    }

    const invoicePriceListId =
      await this.sequelize.models.InvoicePriceList.getIdForPatientEncounter(encounterId);

    if (invoicePriceListId) {
      // Confirm invoice product is not configured to be hidden for this price list
      const hiddenInvoicePriceListItem = await this.sequelize.models.InvoicePriceListItem.findOne({
        where: {
          invoicePriceListId,
          invoiceProductId: invoiceProduct.id,
          isHidden: true,
        },
      });
      if (hiddenInvoicePriceListItem) {
        return;
      }
    }

    const quantity = this.normaliseInvoiceItemQuantity(options?.quantity, 1);

    await this.sequelize.models.InvoiceItem.upsert(
      {
        invoiceId: invoice.id,
        sourceRecordType: newItem.getModelName(),
        sourceRecordId: newItem.id,
        productId: invoiceProduct.id,
        orderedByUserId,
        orderDate: new Date(),
        quantity: quantity,
        note: options?.note,
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
    encounterType: EncounterType,
    date: string,
    settings: ReadSettings,
    options?: { transaction?: Transaction },
  ) {
    const isInvoicingEnabled = await settings?.get('features.invoicing.enabled');
    const isValidEncounterType =
      !AUTOMATIC_INVOICE_CREATION_EXCLUDED_ENCOUNTER_TYPES.includes(encounterType);
    if (!isInvoicingEnabled || !isValidEncounterType) {
      return null;
    }

    return await this.create(
      {
        displayId: generateInvoiceDisplayId(),
        status: INVOICE_STATUSES.IN_PROGRESS,
        date,
        encounterId,
      },
      options,
    );
  }

  /**
   * Add the encounter fee to an encounter's in-progress invoice, if one applies.
   *
   * The fee is anchored on the Encounter so it is added at most once. A cashier-removed fee
   * is never re-added: we skip when a line already exists for this encounter, including a
   * soft-deleted one (unlike addItemToInvoice, which restores soft-deleted items on re-add).
   */
  static async addEncounterFee(
    encounter: Encounter,
    settings: ReadSettings,
    primaryTimeZone: string,
  ) {
    const invoice = await this.getInProgressInvoiceForEncounter(encounter.id);
    if (!invoice) {
      return;
    }

    const { InvoiceItem } = this.sequelize.models;
    // Idempotent and cashier-aware: never re-add a fee line for this encounter, including one a
    // cashier has already removed (soft-deleted).
    const existingItem = await InvoiceItem.findOne({
      where: {
        invoiceId: invoice.id,
        sourceRecordType: encounter.getModelName(),
        sourceRecordId: encounter.id,
      },
      paranoid: false,
    });
    if (existingItem) {
      return;
    }

    const [
      facilityTimeZone,
      standardHoursStart,
      standardHoursEnd,
      emergencyStandardHoursStart,
      emergencyStandardHoursEnd,
      pharmacyDepartmentId,
    ] = await Promise.all([
      settings.get('facilityTimeZone'),
      settings.get('invoicing.encounterFee.standardHoursStart'),
      settings.get('invoicing.encounterFee.standardHoursEnd'),
      settings.get('invoicing.encounterFee.emergencyStandardHoursStart'),
      settings.get('invoicing.encounterFee.emergencyStandardHoursEnd'),
      settings.get('medications.medicationDispensing.automaticEncounterDepartmentId'),
    ]);

    // A walk-in pharmacy dispensing encounter is created in the configured pharmacy department and
    // charges a separate, flat pharmacy fee instead of a clinic fee. The Boolean guard stops a
    // null setting matching a null department.
    const isPharmacyEncounter =
      Boolean(pharmacyDepartmentId) && encounter.departmentId === pharmacyDepartmentId;

    const product = isPharmacyEncounter
      ? await this.resolvePharmacyFeeProduct()
      : await this.resolveClinicOrEmergencyFeeProduct({
          encounter,
          primaryTimeZone,
          facilityTimeZone: facilityTimeZone as string | null,
          standardHoursStart: standardHoursStart as string,
          standardHoursEnd: standardHoursEnd as string,
          emergencyStandardHoursStart: emergencyStandardHoursStart as string,
          emergencyStandardHoursEnd: emergencyStandardHoursEnd as string,
        });
    if (!product) {
      return;
    }

    const { InvoicePriceList, InvoicePriceListItem } = this.sequelize.models;
    const invoicePriceListId = await InvoicePriceList.getIdForPatientEncounter(encounter.id);

    if (isPharmacyEncounter) {
      // Charging for pharmacy is opt-in: only add the fee where the facility has priced the
      // pharmacy product (a visible price-list item). Unpriced → no fee line.
      const pricedItem = invoicePriceListId
        ? await InvoicePriceListItem.findOne({
            where: { invoicePriceListId, invoiceProductId: product.id, isHidden: false },
          })
        : null;
      if (!pricedItem) {
        return;
      }
    } else if (invoicePriceListId) {
      // Clinic/ED fees apply wherever the encounter type qualifies; a facility can still suppress
      // one by hiding that product on its price list.
      const hiddenItem = await InvoicePriceListItem.findOne({
        where: { invoicePriceListId, invoiceProductId: product.id, isHidden: true },
      });
      if (hiddenItem) {
        return;
      }
    }

    await InvoiceItem.create({
      invoiceId: invoice.id,
      sourceRecordType: encounter.getModelName(),
      sourceRecordId: encounter.id,
      productId: product.id,
      orderedByUserId: SYSTEM_USER_UUID,
      orderDate: new Date(),
      quantity: 1,
    });
  }

  private static async resolveClinicOrEmergencyFeeProduct({
    encounter,
    primaryTimeZone,
    facilityTimeZone,
    standardHoursStart,
    standardHoursEnd,
    emergencyStandardHoursStart,
    emergencyStandardHoursEnd,
  }: {
    encounter: Encounter;
    primaryTimeZone: string;
    facilityTimeZone: string | null;
    standardHoursStart: string;
    standardHoursEnd: string;
    emergencyStandardHoursStart: string;
    emergencyStandardHoursEnd: string;
  }) {
    const feeCode = selectEncounterFeeCode({
      encounterType: encounter.encounterType as EncounterType,
      startDateTime: encounter.startDate,
      primaryTimeZone,
      facilityTimeZone,
      standardHoursStart,
      standardHoursEnd,
      emergencyStandardHoursStart,
      emergencyStandardHoursEnd,
    });
    if (!feeCode) {
      return null;
    }

    const product = await this.findEncounterFeeProduct(
      INVOICE_ITEMS_CATEGORIES.ENCOUNTER_FEE,
      REFERENCE_TYPES.ENCOUNTER_FEE,
      feeCode,
    );
    if (product) {
      return product;
    }

    // No distinct weekend product configured → fall back to the matching after-hours product
    // (clinic weekend → clinic after-hours, ED weekend → ED after-hours).
    const weekendFallbacks: Record<string, string> = {
      [ENCOUNTER_FEE_CODES.WEEKEND]: ENCOUNTER_FEE_CODES.AFTER_HOURS,
      [ENCOUNTER_FEE_CODES.EMERGENCY_WEEKEND]: ENCOUNTER_FEE_CODES.EMERGENCY_AFTER_HOURS,
    };
    const fallbackCode = weekendFallbacks[feeCode];
    if (!fallbackCode) {
      return null;
    }
    return this.findEncounterFeeProduct(
      INVOICE_ITEMS_CATEGORIES.ENCOUNTER_FEE,
      REFERENCE_TYPES.ENCOUNTER_FEE,
      fallbackCode,
    );
  }

  private static resolvePharmacyFeeProduct() {
    return this.findEncounterFeeProduct(
      INVOICE_ITEMS_CATEGORIES.PHARMACY_ENCOUNTER_FEE,
      REFERENCE_TYPES.PHARMACY_ENCOUNTER_FEE,
      PHARMACY_ENCOUNTER_FEE_CODE,
    );
  }

  private static findEncounterFeeProduct(category: string, referenceType: string, code: string) {
    const { InvoiceProduct, ReferenceData } = this.sequelize.models;
    return InvoiceProduct.findOne({
      where: { category },
      include: [
        {
          model: ReferenceData,
          as: 'sourceRefDataRecord',
          required: true,
          where: { type: referenceType, code },
        },
      ],
    });
  }

  /**
   * Recompute the per-night bed fee for an admission encounter and reconcile it onto the invoice.
   *
   * One night is charged per facility-local overnight check the patient is still admitted for
   * (and the admission night, minimum one). Each night is attributed to the location occupied at
   * that time, so the invoice carries one line per location with quantity = nights. A location is
   * charged only if it has a bed-fee product (placeholder wards have none). Recompute SETS the
   * quantity, and a cashier-removed line is not resurrected.
   */
  static async recalculateBedFee(
    encounter: Encounter,
    settings: ReadSettings,
    primaryTimeZone: string,
  ) {
    if (encounter.encounterType !== ENCOUNTER_TYPES.ADMISSION) {
      return;
    }
    const invoice = await this.getInProgressInvoiceForEncounter(encounter.id);
    if (!invoice) {
      return;
    }

    const { InvoiceItem, InvoiceProduct, ChangeLog } = this.sequelize.models;
    const locationSourceType = this.sequelize.models.Location.name;

    const chargeInstants = computeBedFeeChargeInstants({
      startDateTime: encounter.startDate,
      endDateTime: encounter.endDate || getCurrentDateTimeString(),
      overnightChargeTime: (await settings.get('invoicing.bedFee.overnightChargeTime')) as string,
      primaryTimeZone,
      facilityTimeZone: (await settings.get('facilityTimeZone')) as string | null,
    });

    // Reconstruct the location at each instant from the audit changelog (logs.changes) — the
    // source of truth for encounter history. Each row is a full encounter snapshot, so its
    // location_id is the location as of that write. `record_updated_at` (a timestamptz) is the
    // write clock; rendered in the primary timezone it dates each ward move to when it happened,
    // since moves are recorded as they occur. The exception is the admission itself: encounters
    // are often recorded after the patient arrived, so the earliest row takes effect from
    // encounter.startDate (the same anchor as the charge instants) rather than its data-entry
    // time — otherwise backdated admission nights would fall back to the current location and be
    // billed to a ward the patient later moved to. migrationContext is excluded so rows backfilled
    // by data migrations (which may lack location_id) don't shadow real writes.
    const changelogRows = await ChangeLog.findAll({
      where: {
        tableSchema: 'public',
        tableName: 'encounters',
        recordId: encounter.id,
        migrationContext: null,
      },
      order: [['recordUpdatedAt', 'ASC']],
      attributes: ['recordUpdatedAt', 'recordData'],
    });
    const locationHistory = changelogRows.map((row, index) => ({
      date:
        index === 0
          ? encounter.startDate
          : instantToDateTimeStringInTimezone(row.recordUpdatedAt, primaryTimeZone),
      // recordData is a JSONB encounter snapshot (typed as string on the model, object at runtime).
      locationId: (row.recordData as unknown as Record<string, any>)?.location_id ?? null,
    }));
    const locationIdAtInstant = (instant: string): string | null => {
      let locationId: string | null | undefined;
      for (const change of locationHistory) {
        if (change.date! > instant) break; // ascending history — no later row can precede this instant
        locationId = change.locationId;
      }
      return locationId ?? encounter.locationId ?? null;
    };

    // Count qualifying nights per location — the rate follows the location occupied at each instant.
    const nightsByLocation = new Map<string, number>();
    for (const instant of chargeInstants) {
      const locationId = locationIdAtInstant(instant);
      if (!locationId) {
        continue;
      }
      nightsByLocation.set(locationId, (nightsByLocation.get(locationId) ?? 0) + 1);
    }

    // Zero out existing bed-fee lines for locations that no longer qualify (not a soft-delete —
    // that's reserved for cashier removals, and the line must stay revivable if the patient
    // returns to the location). Quantity-0 lines are cleaned off the invoice at finalisation.
    const existingItems = await InvoiceItem.findAll({
      where: { invoiceId: invoice.id, sourceRecordType: locationSourceType },
    });
    for (const item of existingItems) {
      if (item.sourceRecordId && !nightsByLocation.has(item.sourceRecordId)) {
        await item.update({ quantity: 0 });
      }
    }

    for (const [locationId, nights] of nightsByLocation) {
      const product = await InvoiceProduct.findOne({
        where: { category: INVOICE_ITEMS_CATEGORIES.BED_FEE, sourceRecordId: locationId },
      });
      if (!product) {
        continue; // location has no bed-fee product (e.g. an "open ward" placeholder) → not charged
      }

      const existing = await InvoiceItem.findOne({
        where: {
          invoiceId: invoice.id,
          sourceRecordType: locationSourceType,
          sourceRecordId: locationId,
        },
        paranoid: false,
      });
      if (existing?.deletedAt) {
        continue; // cashier removed this line — don't resurrect it
      }
      if (existing) {
        await existing.update({ quantity: nights, productId: product.id });
      } else {
        await InvoiceItem.create({
          invoiceId: invoice.id,
          sourceRecordType: locationSourceType,
          sourceRecordId: locationId,
          productId: product.id,
          orderedByUserId: SYSTEM_USER_UUID,
          orderDate: getCurrentDateTimeString(),
          quantity: nights,
        });
      }
    }
  }
}
