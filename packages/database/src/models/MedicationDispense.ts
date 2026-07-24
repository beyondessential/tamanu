import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import {
  buildEncounterPatientIdSelect,
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync';

export class MedicationDispense extends Model {
  declare id: string;
  declare pharmacyOrderPrescriptionId: string;
  declare quantity: number;
  declare instructions?: string;
  declare medicationPresetLabelId?: string;
  declare dispensedByUserId: string;
  declare dispensedAt: string;
  // Dispensed details: what was actually dispensed for this fill. Copied from the prescription at
  // dispense time, or set to pharmacy's modified values when the prescription is modified for
  // dispensing. The original prescription is never altered.
  declare medicationId?: string;
  declare isVariableDose?: boolean;
  declare doseAmount?: string;
  declare dosingUnit?: string;
  declare dispensingUnit?: string;
  declare frequency?: string;
  declare route?: string;
  declare durationValue?: string | null;
  declare durationUnit?: string | null;
  declare pharmacyNotes?: string;
  declare displayPharmacyNotesInMar?: boolean;
  // Modification metadata: only set when pharmacy modified the prescription for this fill.
  // A non-null modifiedAt marks the dispense as modified.
  declare modifiedById?: string | null;
  declare modifiedReasonId?: string | null;
  declare modifiedAt?: string | null;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        instructions: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        dispensedAt: dateTimeType('dispensedAt', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        isVariableDose: DataTypes.BOOLEAN,
        doseAmount: DataTypes.DECIMAL,
        dosingUnit: DataTypes.STRING,
        dispensingUnit: DataTypes.STRING,
        frequency: DataTypes.STRING,
        route: DataTypes.STRING,
        durationValue: DataTypes.DECIMAL,
        durationUnit: DataTypes.STRING,
        pharmacyNotes: DataTypes.STRING,
        displayPharmacyNotesInMar: DataTypes.BOOLEAN,
        modifiedAt: dateTimeType('modifiedAt'),
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.PharmacyOrderPrescription, {
      foreignKey: 'pharmacyOrderPrescriptionId',
      as: 'pharmacyOrderPrescription',
    });

    this.belongsTo(models.User, {
      foreignKey: 'dispensedByUserId',
      as: 'dispensedBy',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'medicationPresetLabelId',
      as: 'medicationPresetLabel',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'medicationId',
      as: 'medication',
    });

    this.belongsTo(models.User, {
      foreignKey: 'modifiedById',
      as: 'modifiedBy',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'modifiedReasonId',
      as: 'modifiedReason',
    });
  }

  static getListReferenceAssociations() {
    return ['pharmacyOrderPrescription', 'dispensedBy', 'medicationPresetLabel'];
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'pharmacy_order_prescriptions', 'pharmacy_orders', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterPatientIdSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([
        this.tableName,
        'pharmacy_order_prescriptions',
        'pharmacy_orders',
        'encounters',
      ]),
    };
  }
}


