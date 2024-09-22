import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, TASK_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';

export class Task extends Model {
  /**
   *
   * @param {any} arg0
   * @param {import('./')} models
   */
  static init({ primaryKey, ...options }, models) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        dueTime: dateTimeType('dueTime', {
          allowNull: false,
        }),
        endTime: dateTimeType('endTime', {
          allowNull: true,
        }),
        requestTime: dateTimeType('requestTime', {
          allowNull: false,
        }),
        status: {
          type: DataTypes.ENUM(Object.values(TASK_STATUSES)),
          defaultValue: TASK_STATUSES.TODO,
          allowNull: false,
        },
        note: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        frequencyValue: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        frequencyUnit: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        highPriority: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        parentTaskId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: this,
            key: 'id',
          },
        },
        completedTime: dateTimeType('completedTime', {
          allowNull: true,
        }),
        completedNote: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        notCompletedTime: dateTimeType('notCompletedTime', {
          allowNull: true,
        }),
        todoTime: dateTimeType('todoTime', {
          allowNull: true,
        }),
        todoNote: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        deletedTime: dateTimeType('deletedTime', {
          allowNull: true,
        }),
      },
      {
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        ...options,
        hooks: {
          async beforeDestroy(task, opts) {
            await models.TaskDesignation.destroy({
              where: { taskId: task.id },
              transaction: opts.transaction,
            });
          },
        },
      },
    );
  }

  /**
   *
   * @param {import('./')} models
   */
  static initRelations(models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.User, {
      foreignKey: 'requestedByUserId',
      as: 'requestedBy',
    });
    this.hasMany(models.TaskDesignation, {
      foreignKey: 'taskId',
      as: 'designations',
    });
    this.belongsTo(models.User, {
      foreignKey: 'completedByUserId',
      as: 'completedBy',
    });
    this.belongsTo(models.User, {
      foreignKey: 'notCompletedByUserId',
      as: 'notCompletedBy',
    });
    this.belongsTo(models.User, {
      foreignKey: 'todoByUserId',
      as: 'todoBy',
    });
    this.belongsTo(models.User, {
      foreignKey: 'deletedByUserId',
      as: 'deletedBy',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'notCompletedReasonId',
      as: 'notCompletedReason',
    });
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'deletedReasonId',
      as: 'deletedReason',
    });
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

  static getFullReferenceAssociations() {
    const { models } = this.sequelize;

    return [
      {
        model: models.Encounter,
        as: 'encounter',
        attributes: ['id'],
      },
      {
        model: models.User,
        as: 'requestedBy',
        attributes: ['displayName'],
      },
      {
        model: models.TaskDesignation,
        as: 'designations',
        attributes: ['designationId'],
        include: [
          {
            model: models.ReferenceData,
            as: 'referenceData',
            attributes: ['name'],
          },
        ],
      },
      {
        model: models.User,
        as: 'completedBy',
        attributes: ['displayName'],
      },
      {
        model: models.User,
        as: 'notCompletedBy',
        attributes: ['displayName'],
      },
      {
        model: models.User,
        as: 'todoBy',
        attributes: ['displayName'],
      },
      {
        model: models.User,
        as: 'deletedBy',
        attributes: ['displayName'],
      },
      {
        model: models.ReferenceData,
        as: 'notCompletedReason',
        attributes: ['name'],
      },
      {
        model: models.ReferenceData,
        as: 'deletedReason',
        attributes: ['name'],
      },
    ];
  }
}
