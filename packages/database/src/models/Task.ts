import { DataTypes, Op, type Transaction } from 'sequelize';
import {
  SYNC_DIRECTIONS,
  TASK_STATUSES,
  TASK_DELETE_PATIENT_DISCHARGED_REASON_ID,
  SYSTEM_USER_UUID,
  TASK_DURATION_UNIT,
  TASK_TYPES,
} from '@tamanu/constants';
import { v4 as uuidv4 } from 'uuid';
import config from 'config';
import ms from 'ms';
import { addMilliseconds } from 'date-fns';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import type { Encounter } from './Encounter';
import type { TaskDesignation } from './TaskDesignation';

const TASK_STATUS_VALUES = Object.values(TASK_STATUSES);

export class Task extends Model {
  declare id: string;
  declare name: string;
  declare dueTime: string;
  declare endTime?: string;
  declare requestTime: string;
  declare status: (typeof TASK_STATUS_VALUES)[number];
  declare note?: string;
  declare frequencyValue?: number;
  declare frequencyUnit?: string;
  declare durationValue?: number;
  declare durationUnit?: string;
  declare highPriority?: boolean;
  declare parentTaskId?: string;
  declare completedTime?: string;
  declare completedNote?: string;
  declare notCompletedTime?: string;
  declare todoTime?: string;
  declare todoNote?: string;
  declare deletedTime?: string;
  declare encounterId?: string;
  declare requestedByUserId?: string;
  declare completedByUserId?: string;
  declare notCompletedByUserId?: string;
  declare todoByUserId?: string;
  declare deletedByUserId?: string;
  declare notCompletedReasonId?: string;
  declare deletedReasonId?: string;
  declare deletedReasonForSyncId?: string;
  declare taskType: string;
  declare designations: TaskDesignation[];

  static initModel({ primaryKey, ...options }: InitOptions, models: Models) {
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
          type: DataTypes.ENUM(...TASK_STATUS_VALUES),
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
        durationValue: {
          type: DataTypes.DECIMAL,
          allowNull: true,
        },
        durationUnit: {
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
        taskType: {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: TASK_TYPES.NORMAL_TASK,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          async afterDestroy(task: Task, opts) {
            await models.TaskDesignation.destroy({
              where: { taskId: task.id },
              transaction: opts.transaction,
            });
          },
        },
      },
    );
  }

  isRepeatingTask() {
    return this.frequencyValue && this.frequencyUnit;
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Task, {
      foreignKey: 'parentTaskId',
      as: 'parentTask',
    });
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
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'deletedReasonForSyncId',
      as: 'deletedReasonForSync',
    });
    this.belongsToMany(models.ReferenceData, {
      through: models.TaskDesignation,
      foreignKey: 'taskId',
      as: 'designations',
    });
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

  static async buildSyncLookupQueryDetails() {
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
        attributes: ['id', 'name'],
        through: {
          attributes: [],
        },
      },
    ];
  }

  static async generateRepeatingTasks(tasks: Task[]) {
    const allGeneratedTasks = [];
    const allClonedDesignations = [];

    const repeatingTasks = tasks.filter((task) => task.frequencyValue && task.frequencyUnit);

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
      const { frequencyValue, frequencyUnit, durationValue, durationUnit } = task;
      const frequencyString = `${frequencyValue} ${frequencyUnit}`;
      const frequency = ms(frequencyString as any) as unknown as number;

      const maxDueTime = addMilliseconds(
        new Date(),
        ms(`${upcomingTasksShouldBeGeneratedTimeFrame} hours`),
      );
      let nextDueTime = addMilliseconds(new Date(lastGeneratedTask.dueTime), frequency);
      const generatedTasks = [];

      // const parsedStartDate = parseISO(startDate);
      // const duration = parseInt(durationValue, 10);
      // add(parsedStartDate, { [durationUnit]: duration });
      let endDate = Infinity;
      if (durationValue && durationUnit) {
        switch (durationUnit) {
          case TASK_DURATION_UNIT.OCCURRENCES:
            endDate = addMilliseconds(
              new Date(task.dueTime),
              frequency * (durationValue - 1),
            ).getTime();
            break;
          default: {
            const durationString = `${durationValue} ${durationUnit}`;
            const duration = ms(durationString as any) as unknown as number;
            endDate = addMilliseconds(new Date(task.dueTime), duration).getTime();
            break;
          }
        }
      }

      // Use a while loop to generate tasks until we reach maxDueTime or endDateTime
      while (nextDueTime.getTime() <= maxDueTime.getTime() && nextDueTime.getTime() <= endDate) {
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
          durationValue: task.durationValue,
          durationUnit: task.durationUnit,
          highPriority: task.highPriority,
          parentTaskId: task.id,
        };
        generatedTasks.push(nextTask);

        // Increment nextDueTime for the next iteration
        nextDueTime = addMilliseconds(nextDueTime, frequency);
      }

      const clonedDesignations = [];

      for (const generatedTask of generatedTasks) {
        clonedDesignations.push(
          ...task.designations.map((designation) => ({
            taskId: generatedTask.id,
            designationId: designation.id,
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

  static async onEncounterDischarged(encounter: Encounter, transaction?: Transaction) {
    const { models } = this.sequelize;
    const encounterId = encounter.id;
    const endTime = encounter.endDate;

    const taskDeletionReason = await models.ReferenceData.findByPk(
      TASK_DELETE_PATIENT_DISCHARGED_REASON_ID,
    );

    await models.Task.update(
      {
        endTime,
        deletedReasonForSyncId: taskDeletionReason?.id ?? null,
      },
      {
        where: {
          encounterId,
          parentTaskId: null,
          frequencyValue: { [Op.not]: null },
          frequencyUnit: { [Op.not]: null },
        },
        transaction,
      },
    );

    await models.Task.update(
      {
        deletedByUserId: SYSTEM_USER_UUID,
        deletedReasonId: taskDeletionReason?.id ?? null,
        deletedTime: getCurrentDateTimeString(),
      },
      {
        where: {
          encounterId,
          status: TASK_STATUSES.TODO,
          dueTime: { [Op.gt]: endTime },
          frequencyValue: { [Op.not]: null },
          frequencyUnit: { [Op.not]: null },
        },
        transaction,
      },
    );

    await models.Task.destroy({
      where: {
        encounterId,
        status: TASK_STATUSES.TODO,
        dueTime: { [Op.gt]: endTime },
        frequencyValue: { [Op.not]: null },
        frequencyUnit: { [Op.not]: null },
      },
      transaction,
      individualHooks: true,
    });
  }
}
