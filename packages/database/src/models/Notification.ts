import { DataTypes, type CreateOptions } from 'sequelize';
import { SYNC_DIRECTIONS, NOTIFICATION_TYPES, NOTIFICATION_STATUSES } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { log } from '@tamanu/shared/services/logging';
import { Model } from './Model';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { buildPatientLinkedLookupFilter, buildPatientSyncFilterViaPatientId } from '../sync';

const NOTIFICATION_TYPE_VALUES = Object.values(NOTIFICATION_TYPES);
const NOTIFICATION_STATUS_VALUES = Object.values(NOTIFICATION_STATUSES);

export class Notification extends Model {
  declare id: string;
  declare type: (typeof NOTIFICATION_TYPE_VALUES)[number];
  declare status: (typeof NOTIFICATION_STATUS_VALUES)[number];
  declare createdTime?: string;
  declare metadata: Record<string, any>;
  declare userId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        type: {
          type: DataTypes.ENUM(...NOTIFICATION_TYPE_VALUES),
          allowNull: false,
        },
        status: {
          type: DataTypes.ENUM(...NOTIFICATION_STATUS_VALUES),
          defaultValue: NOTIFICATION_STATUSES.UNREAD,
          allowNull: false,
        },
        createdTime: dateTimeType('createdTime', {
          allowNull: true,
        }),
        metadata: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static getFullReferenceAssociations() {
    const { models } = this.sequelize;

    return [
      {
        model: models.User,
        as: 'user',
        attributes: ['id', 'displayName'],
      },
      {
        model: models.Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'middleName', 'lastName', 'displayId'],
      },
    ];
  }

  static async pushNotification(
    type: (typeof NOTIFICATION_TYPE_VALUES)[number],
    metadata: Record<string, any>,
    options?: CreateOptions<any>,
  ) {
    try {
      const additionalMetadata: Record<string, any> = {};
      const { models } = this.sequelize;

      let patientId;
      let userId;
      switch (type) {
        case NOTIFICATION_TYPES.IMAGING_REQUEST: {
          userId = metadata.requestedById;
          const encounter = await models.Encounter.findByPk(metadata.encounterId);
          patientId = encounter!.patientId;
          break;
        }
        case NOTIFICATION_TYPES.LAB_REQUEST: {
          userId = metadata.requestedById;
          const encounter = await models.Encounter.findByPk(metadata.encounterId);
          patientId = encounter!.patientId;
          break;
        }
        case NOTIFICATION_TYPES.PHARMACY_NOTE: {
          userId = metadata.prescriberId;
          const encounterPrescription = await models.EncounterPrescription.findOne({
            where: { prescriptionId: metadata.id },
            include: ['encounter'],
          });
          patientId = encounterPrescription!.encounter!.patientId;
          additionalMetadata.encounterId = encounterPrescription!.encounterId;
          break;
        }
        default:
          return;
      }

      if (!patientId || !userId) {
        return;
      }

      await this.create(
        {
          type,
          metadata: { ...metadata, ...additionalMetadata },
          userId,
          patientId,
          createdTime: getCurrentDateTimeString(),
        },
        options,
      );
    } catch (error) {
      log.error('Error pushing notification', error);
    }
  }
}
