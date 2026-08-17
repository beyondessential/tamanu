import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import type { EncounterDischargeDraftMedication } from './EncounterDischargeDraftMedication';

/**
 * A clinician's part-completed discharge form, saved so they can come back to it after an
 * interruption.
 *
 * This is working state rather than clinical record: the discharge itself is only recorded when
 * the form is finalised, at which point every draft on the encounter is cleared. Drafts are
 * facility-local and do not sync, since they have no meaning outside the server the clinician
 * is working against.
 */
export class EncounterDischargeDraft extends Model {
  declare id: string;
  declare encounterId: string;
  declare userId: string;
  declare endDate?: string;
  declare dischargerId?: string;
  declare dispositionId?: string;
  declare note?: string;
  declare seededNoteIds: string[];
  declare orderingClinicianId?: string;

  declare medications?: EncounterDischargeDraftMedication[];

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        endDate: dateTimeType('endDate'),
        note: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        seededNoteIds: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          allowNull: false,
          defaultValue: [],
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        // Working state rather than clinical record, so clearing a draft removes it outright and
        // leaves nothing behind: these tables are in NON_LOGGED_TABLES too, so there is no
        // change-log trail either. The soft-delete and audit rules cover the discharge itself,
        // which is written on finalisation and never touched by this table.
        paranoid: false,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    this.belongsTo(models.User, {
      foreignKey: 'dischargerId',
      as: 'discharger',
    });
    this.belongsTo(models.User, {
      foreignKey: 'orderingClinicianId',
      as: 'orderingClinician',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'dispositionId',
      as: 'disposition',
    });
    this.hasMany(models.EncounterDischargeDraftMedication, {
      foreignKey: 'dischargeDraftId',
      as: 'medications',
    });
  }
}
