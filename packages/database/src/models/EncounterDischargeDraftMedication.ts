import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { type InitOptions, type Models } from '../types/model';

/**
 * One medication line of a saved discharge draft: what the clinician had entered for a
 * prescription before they were interrupted.
 */
export class EncounterDischargeDraftMedication extends Model {
  declare id: string;
  declare dischargeDraftId: string;
  declare prescriptionId: string;
  declare quantity?: number;
  declare repeats?: number;
  declare sendToPharmacy: boolean;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        repeats: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        sendToPharmacy: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        // Removed outright with the draft it belongs to; see EncounterDischargeDraft.
        paranoid: false,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.EncounterDischargeDraft, {
      foreignKey: 'dischargeDraftId',
      as: 'dischargeDraft',
    });
    this.belongsTo(models.Prescription, {
      foreignKey: 'prescriptionId',
      as: 'prescription',
    });
  }
}
