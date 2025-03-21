import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class EncounterMedication extends Model {
  declare id: string;
  declare date: string;
  declare endDate?: string;
  declare prescription?: string;
  declare note?: string;
  declare indication?: string;
  declare route?: string;
  declare qtyMorning?: number;
  declare qtyLunch?: number;
  declare qtyEvening?: number;
  declare qtyNight?: number;
  declare quantity?: number;
  declare discontinued?: boolean;
  declare discontinuedDate?: string;
  declare discontinuingReason?: string;
  declare repeats?: number;
  declare isDischarge: boolean;
  declare prescriberId?: string;
  declare discontinuingClinicianId?: string;
  declare encounterId?: string;
  declare medicationId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,

        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        endDate: dateTimeType('endDate'),

        prescription: DataTypes.STRING,
        note: DataTypes.STRING,
        indication: DataTypes.STRING,
        route: DataTypes.STRING,

        qtyMorning: DataTypes.INTEGER,
        qtyLunch: DataTypes.INTEGER,
        qtyEvening: DataTypes.INTEGER,
        qtyNight: DataTypes.INTEGER,
        quantity: DataTypes.INTEGER,

        discontinued: DataTypes.BOOLEAN,
        discontinuedDate: DataTypes.STRING,
        discontinuingReason: DataTypes.STRING,
        repeats: DataTypes.INTEGER,
        isDischarge: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveMedication() {
            if (!this.medicationId) {
              throw new Error('An encounter medication must be attached to a medication.');
            }
          },
          mustHaveEncounter() {
            if (!this.encounterId) {
              throw new Error('An encounter medication must be attached to an encounter.');
            }
          },
        },
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'prescriberId',
      as: 'prescriber',
    });
    this.belongsTo(models.User, {
      foreignKey: 'discontinuingClinicianId',
      as: 'discontinuingClinician',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'medicationId',
      as: 'Medication',
    });
  }

  static getListReferenceAssociations() {
    return ['Medication', 'encounter', 'prescriber', 'discontinuingClinician'];
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

  static buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
