import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS, TASK_STATUSES } from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from './buildEncounterLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import config from 'config';
import ms from 'ms';
import { addMilliseconds } from 'date-fns';
import { toDateTimeString } from '../utils/dateTime';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';

export class Task extends Model {
  static init({ primaryKey, ...options }) {
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
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
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
    this.belongsToMany(models.ReferenceData, {
      through: models.TaskDesignation,
      foreignKey: 'taskId',
      as: 'designations',
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
      {
        model: models.ReferenceData,
        as: 'designations',
        attributes: ['name'],
        through: {
          attributes: [],
        },
      },
    ];
  }

  static async generateRepeatingTasks(tasks) {
    const allGeneratedTasks = [];
    const allClonedDesignations = [];

    const repeatingTasks = tasks.filter(task => task.frequencyValue && task.frequencyUnit);

    for (const task of repeatingTasks) {
      let lastGeneratedTask = await this.findOne({
        where: {
          parentTaskId: task.id,
        },
        order: [['dueTime', 'DESC']],
      });
      if (!lastGeneratedTask) {
        // no tasks have been generated yet
        lastGeneratedTask = task;
      }

      const upcomingTasksShouldBeGeneratedTimeFrame =
        config.tasking?.upcomingTasksShouldBeGeneratedTimeFrame || 72;
      const { frequencyValue, frequencyUnit } = task;
      const frequency = ms(`${frequencyValue} ${frequencyUnit}`);

      const maxDueTime = addMilliseconds(
        new Date(),
        ms(`${upcomingTasksShouldBeGeneratedTimeFrame} hours`),
      );
      let nextDueTime = addMilliseconds(new Date(lastGeneratedTask.dueTime), frequency);
      const generatedTasks = [];

      for (
        ;
        nextDueTime.getTime() < maxDueTime.getTime();
        nextDueTime = addMilliseconds(nextDueTime, frequency)
      ) {
        const nextTask = {
          id: uuidv4(),
          encounterId: task.encounterId,
          requestedByUserId: task.requestedByUserId,
          name: task.name,
          dueTime: toDateTimeString(nextDueTime),
          requestTime: task.requestTime,
          status: TASK_STATUSES.TODO,
          note: task.note,
          frequencyValue: task.frequencyValue,
          frequencyUnit: task.frequencyUnit,
          highPriority: task.highPriority,
          parentTaskId: task.id,
        };
        generatedTasks.push(nextTask);
      }

      const clonedDesignations = [];

      for (const generatedTask of generatedTasks) {
        clonedDesignations.push(
          ...task.designations.map(designation => ({
            taskId: generatedTask.id,
            designationId: designation.designationId,
          })),
        );
      }
      allGeneratedTasks.push(...generatedTasks);
      allClonedDesignations.push(...clonedDesignations);
    }

    if (allGeneratedTasks.length) {
      await this.bulkCreate(allGeneratedTasks);
    }
    if (allClonedDesignations.length) {
      await this.sequelize.models.TaskDesignation.bulkCreate(allClonedDesignations);
    }
  }
}
