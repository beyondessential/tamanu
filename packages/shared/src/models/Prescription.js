import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';

export class Prescription extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
        endDate: dateTimeType('endDate'),

        prescription: Sequelize.STRING,
        note: Sequelize.STRING,
        indication: Sequelize.STRING,
        route: Sequelize.STRING,

        quantity: Sequelize.INTEGER,

        discontinued: Sequelize.BOOLEAN,
        discontinuedDate: Sequelize.STRING,
        discontinuingReason: Sequelize.STRING,
        repeats: Sequelize.INTEGER,
        isDischarge: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'prescriberId',
      as: 'prescriber',
    });
    this.belongsTo(models.User, {
      foreignKey: 'discontinuingClinicianId',
      as: 'discontinuingClinician',
    });

    this.belongsToMany(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounters',
      through: models.EncounterPrescription,
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'prescriptionId',
      as: 'Medication',
    });
  }

  static getListReferenceAssociations() {
    return ['Medication', 'encounters', 'prescriber', 'discontinuingClinician'];
  }

  static buildPatientSyncFilter(patientCount, markedForSyncPatientsTable) {
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
