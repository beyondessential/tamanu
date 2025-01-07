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
        validate: {
          mustHavePrescriptions() {
            if (!this.prescriptionId) {
              throw new Error('An encounter medication must be attached to a prescription.');
            }
          },
          async mustHaveEncounters() {
            const encounterCount = await this.countEncounters(); // Custom method to count encounters
            if (encounterCount === 0) {
              throw new Error('A prescription must be associated with at least one encounter.');
            }
          },
        },
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
      as: 'prescriptions',
    });
  }

  static getListReferenceAssociations() {
    return ['prescriptions', 'encounters', 'prescriber', 'discontinuingClinician'];
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

  async countEncounters() {
    return await this.getEncounters({ attributes: ['id'] }).then(encounters => encounters.length);
  }
}
