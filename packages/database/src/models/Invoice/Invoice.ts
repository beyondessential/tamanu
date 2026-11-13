import { DataTypes, literal, Transaction } from 'sequelize';
import {
  INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES,
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
  ENCOUNTER_TYPE_PATIENT_STATUSES,
  VISIBILITY_STATUSES,
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
import {
  selectEncounterFeeCode,
  computeBedFeeChargeInstants,
  countBedFeeNightsByLocation,
} from '@tamanu/utils/invoice';
import type { Prescription } from 'models/Prescription';
import type { Encounter } from '../Encounter';
import type { Location } from '../Location';
import { stringToStableInteger } from '@tamanu/shared/utils';

const BASE_INVOICE_ITEM_ADVISORY_KEY = 'addItemToInvoiceAdvisoryLock';

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
  declare insurancePlanPaymentStatus: string;
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
        insurancePlanPaymentStatus: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: INVOICE_INSURANCE_PLAN_PAYMENT_STATUSES.UNPAID,
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

  /**
   * The associations that load an invoice ready to price: its items priced against the price
   * list that applies to its encounter, its discount, insurance plans and payments.
   *
   * Use this rather than `getFullReferenceAssociations` wherever the invoice will be priced.
   * Without a price list, items load with no price and silently price at zero.
   */
  static async getPricingAssociations(
    encounterId: string,
    options: { includeRefundingPayments?: boolean } = {},
  ) {
    const { include } = await this.resolvePricingAssociations(encounterId, options);
    return include;
  }

  /**
   * As `getPricingAssociations`, also returning the id of the price list the invoice is priced
   * against, for callers that report it.
   */
  static async resolvePricingAssociations(
    encounterId: string,
    options: { includeRefundingPayments?: boolean } = {},
  ) {
    const invoicePriceListId =
      await this.sequelize.models.InvoicePriceList.getIdForPatientEncounter(encounterId);
    return {
      invoicePriceListId,
      include: this.getFullReferenceAssociations(
        invoicePriceListId ?? undefined,
        options.includeRefundingPayments,
      ),
    };
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

  /** The invoice sections a deployment has configured. Hiding a row is how one is turned off. */
  static async listConfiguredInvoiceSections() {
    return this.sequelize.models.ReferenceData.findAll({
      where: {
        type: REFERENCE_TYPES.INVOICE_SECTION,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
      attributes: ['id', 'code', 'name'],
      raw: true,
    });
  }

  /**
   * What a manually added item needs to be placed: the sections it may name, and the one it goes
   * to when it names none. Read together because a save that adds an item needs both, and one
   * that only edits existing lines needs neither.
   */
  static async resolveManualItemPlacement(encounterId: string) {
    const configuredSections = await this.listConfiguredInvoiceSections();
    return {
      configuredSectionIds: new Set(configuredSections.map(section => section.id)),
      currentSectionId: await this.resolveInvoiceSectionIdForEncounter(encounterId),
    };
  }

  /**
   * The section an item charged against this encounter belongs to. Where a caller adds several
   * items at once it resolves this itself and passes it in; a caller adding one item leaves it to
   * the create path below, which costs the same either way.
   */
  static async resolveInvoiceSectionIdForEncounter(encounterId: string) {
    const encounter = await this.sequelize.models.Encounter.findByPk(encounterId, {
      attributes: ['encounterType'],
    });
    return this.resolveInvoiceSectionId(encounter?.encounterType);
  }

  /**
   * The invoice section an item added now belongs to, from the encounter's category. Null for an
   * encounter type that is never sectioned, and for a deployment that has not configured the
   * matching section, so an invoice there stays flat rather than failing to add the item.
   */
  static async resolveInvoiceSectionId(encounterType?: EncounterType | null) {
    const patientStatus = encounterType
      ? ENCOUNTER_TYPE_PATIENT_STATUSES[encounterType]
      : undefined;
    if (!patientStatus) {
      return null;
    }

    const section = await this.sequelize.models.ReferenceData.findOne({
      where: {
        type: REFERENCE_TYPES.INVOICE_SECTION,
        code: patientStatus,
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      },
    });
    return section?.id ?? null;
  }

  static async addItemToInvoice(
    newItem: InvoiceItemSourceRecord,
    encounterId: string,
    invoiceProduct: InvoiceProduct,
    orderedByUserId: string = SYSTEM_USER_UUID,
    options?: {
      quantity?: number;
      note?: string;
      /** Resolved by the caller where several items are added together. */
      invoiceSectionId?: string | null;
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

    const values = {
      productId: invoiceProduct.id,
      orderedByUserId,
      orderDate: new Date(),
      quantity,
      note: options?.note,
    };

    // Not a plain upsert() because invoice_items_invoice_id_source_record_type_source_record_id_un
    // is DEFERRABLE (see TAM-7004), and Postgres forbids deferrable constraints as
    // ON CONFLICT arbiters.
    // We use an advisory lock here to avoid concurrent creates of the same invoiceItem which would violate
    // the uniqueness constraint.
    const upsertInvoiceItem = async () => {
      const lockId = stringToStableInteger(
        `${BASE_INVOICE_ITEM_ADVISORY_KEY}:${invoice.id}:${newItem.getModelName()}:${newItem.id}`,
      );
      await this.sequelize.query(`SELECT pg_advisory_xact_lock(:lockId)`, {
        replacements: { lockId },
      });

      const existingItem = await this.sequelize.models.InvoiceItem.findOne({
        where: {
          invoiceId: invoice.id,
          sourceRecordType: newItem.getModelName(),
          sourceRecordId: newItem.id,
        },
        paranoid: false,
      });
      if (existingItem) {
        if (existingItem.deletedAt) {
          await existingItem.restore(); // Ensure we restore the item if it already exists
        }
        // The section records where the charge was made, so it stays as it was written even if
        // the encounter has since moved to another category.
        await existingItem.update(values);
      } else {
        // Resolved here rather than above, so an update to an existing line pays nothing for a
        // section it will not write.
        await this.sequelize.models.InvoiceItem.create({
          invoiceId: invoice.id,
          sourceRecordType: newItem.getModelName(),
          sourceRecordId: newItem.id,
          ...values,
          invoiceSectionId:
            options?.invoiceSectionId !== undefined
              ? options.invoiceSectionId
              : await this.resolveInvoiceSectionIdForEncounter(encounterId),
        });
      }
    };

    // sequelize.transaction() always opens a new connection rather than nesting as a savepoint
    // under an ambient CLS transaction, so calling it unconditionally here can deadlock against
    // a caller (e.g. Procedure's updateInvoiceProductAfterUpdateHook) that is already inside a
    // transaction touching the same invoice item row. Reuse the ambient transaction if present.
    if (this.sequelize.isInsideTransaction()) {
      await upsertInvoiceItem();
    } else {
      await this.sequelize.transaction(upsertInvoiceItem);
    }
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
      invoiceSectionId: await this.resolveInvoiceSectionId(encounter.encounterType),
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
      where: { category, visibilityStatus: VISIBILITY_STATUSES.CURRENT },
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

    const chargeInstants = computeBedFeeChargeInstants({
      startDateTime: encounter.startDate,
      endDateTime: encounter.endDate || getCurrentDateTimeString(),
      overnightChargeTime: (await settings.get('invoicing.bedFee.overnightChargeTime')) as string,
      primaryTimeZone,
      facilityTimeZone: (await settings.get('facilityTimeZone')) as string | null,
    });

    const locationHistory = await this.loadEncounterLocationHistory(encounter, primaryTimeZone);
    const nightsByLocation = countBedFeeNightsByLocation(
      chargeInstants,
      locationHistory,
      encounter.locationId ?? null,
    );
    await this.reconcileBedFeeLines(
      invoice,
      nightsByLocation,
      await this.resolveInvoiceSectionId(encounter.encounterType),
    );
  }

  /**
   * The encounter's location timeline from the audit changelog. The admission (first) row anchors
   * to startDate, not its write time, so backdated admission nights bill to the correct ward.
   *
   * The changelog trigger is deferred to commit, so when this runs in the same transaction as an
   * encounter update (e.g. a ward move via the encounter route) that update's row isn't written
   * yet. Append the encounter's live current location as the latest point so a just-made move is
   * billed immediately, matching what the nightly charger later derives from the committed row.
   */
  private static async loadEncounterLocationHistory(
    encounter: Encounter,
    primaryTimeZone: string,
  ): Promise<{ date: string; locationId: string | null }[]> {
    const { ChangeLog } = this.sequelize.models;
    const changelogRows = await ChangeLog.findAll({
      where: {
        tableSchema: 'public',
        tableName: 'encounters',
        recordId: encounter.id,
        migrationContext: null, // exclude migration-backfilled rows; they may lack a location
      },
      order: [['recordUpdatedAt', 'ASC']],
      attributes: ['recordUpdatedAt', 'recordData'],
    });
    const history = changelogRows.map((row, index) => ({
      date:
        index === 0
          ? encounter.startDate
          : instantToDateTimeStringInTimezone(row.recordUpdatedAt, primaryTimeZone),
      // recordData is a JSONB encounter snapshot (typed as string on the model, object at runtime).
      locationId: (row.recordData as unknown as Record<string, any>)?.location_id ?? null,
    }));
    if (encounter.locationId) {
      history.push({ date: getCurrentDateTimeString(), locationId: encounter.locationId });
    }
    return history;
  }

  /**
   * The encounter's type timeline from the audit changelog, oldest first, each revision carrying
   * the encounter type and the start date recorded with it. Both are needed together, which is
   * why this reads the changelog rather than encounter_history: a boundary falls at the
   * clinician-entered admission date, not at the time the move was recorded.
   *
   * Filtered on recordId alone, which `changes_record_id` serves — a hash index on
   * `logs.changes.record_id`. Being a hash index it answers equality only: an IN list, a cast or
   * a record_data filter would each turn this into a sequential scan of the largest table in the
   * deployment.
   */
  static async loadEncounterTypeRevisions(encounterId: string) {
    const { ChangeLog } = this.sequelize.models;
    // record_data is a whole encounter snapshot per row and only two scalars are wanted, so they
    // are extracted in the query rather than hauling every revision's JSONB back. This is a
    // projection, not a filter, so the recordId-only predicate still serves the index.
    const rows = (await ChangeLog.findAll({
      where: {
        tableSchema: 'public',
        tableName: 'encounters',
        recordId: encounterId,
        migrationContext: null, // backfilled rows may carry neither field
      },
      order: [['recordUpdatedAt', 'ASC']],
      attributes: [
        [literal(`record_data->>'encounter_type'`), 'encounterType'],
        [literal(`record_data->>'start_date'`), 'startDate'],
      ],
      raw: true,
    })) as unknown as { encounterType: string | null; startDate: string | null }[];

    return rows.map(row => ({
      encounterType: row.encounterType ?? null,
      startDate: row.startDate ?? null,
    }));
  }

  /**
   * Reconcile per-location lines to the night counts: departed locations are zeroed (kept
   * revivable, not soft-deleted — that's a cashier action); locations with no product are skipped.
   */
  private static async reconcileBedFeeLines(
    invoice: Invoice,
    nightsByLocation: Map<string, number>,
    invoiceSectionId: string | null,
  ) {
    const { InvoiceItem, InvoiceProduct } = this.sequelize.models;
    const locationSourceType = this.sequelize.models.Location.name;

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
        where: {
          category: INVOICE_ITEMS_CATEGORIES.BED_FEE,
          sourceRecordId: locationId,
          visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        },
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
          invoiceSectionId,
        });
      }
    }
  }
}
