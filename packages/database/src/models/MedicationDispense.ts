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
  declare dispensedByUserId: string;
  declare dispensedAt: string;

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
  }

  static getListReferenceAssociations() {
    return ['pharmacyOrderPrescription', 'dispensedBy'];
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


