import { DataTypes, Op } from 'sequelize';
import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { InitOptions, Models } from '../types/model';
import { generateFrequencyDates } from '@tamanu/utils/appointmentScheduling';
import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';

export class LocationAssignmentTemplate extends Model {
  declare id: string;
  declare userId: string;
  declare locationId: string;
  declare date: string;
  declare startTime: string;
  declare endTime: string;
  declare repeatEndDate: string;
  declare repeatFrequency: number;
  declare repeatUnit: keyof typeof REPEAT_FREQUENCY;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        date: {
          type: DataTypes.DATESTRING,
          allowNull: false,
        },
        startTime: {
          type: DataTypes.TIME,
          allowNull: false,
        },
        endTime: {
          type: DataTypes.TIME,
          allowNull: false,
        },
        repeatEndDate: {
          type: DataTypes.DATESTRING,
          allowNull: false,
        },
        repeatFrequency: {
          type: DataTypes.SMALLINT,
          allowNull: false,
          defaultValue: 1,
        },
        repeatUnit: {
          type: DataTypes.ENUM(...REPEAT_FREQUENCY_VALUES),
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL
      },
    );
  }

  static initRelations(models: Models) {
    this.hasMany(models.LocationAssignment, {
      foreignKey: 'templateId',
      as: 'locationAssignments',
    });

    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });

    this.belongsTo(models.Location, {
      foreignKey: 'locationId',
      as: 'location',
    });
  }

  static buildSyncFilter() {
    return `
      LEFT JOIN locations ON ${this.tableName}.location_id = locations.id
      LEFT JOIN location_groups ON locations.location_group_id = location_groups.id
      WHERE COALESCE(location_groups.facility_id, locations.facility_id) IN (:facilityIds)
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildSyncLookupSelect(this, {
        facilityId: 'COALESCE(location_groups.facility_id, locations.facility_id)',
      }),
      joins: `
        LEFT JOIN locations ON ${this.tableName}.location_id = locations.id
        LEFT JOIN location_groups ON locations.location_group_id = location_groups.id
      `,
    };
  }

  /**
   * Generate repeating location assignments
   */
  async generateRepeatingLocationAssignments() {
    const { models } = this.sequelize;
    const { UserLeave } = models;
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error(
        'LocationAssignmentTemplate.generateRepeatingLocationAssignments must always run inside a transaction',
      );
    }

    const {
      repeatFrequency,
      repeatUnit,
      userId,
      locationId,
      startTime,
      endTime,
      repeatEndDate,
    } = this;

    const startDate = this.date;
    const nextAssignmentDates = generateFrequencyDates(
      startDate, repeatEndDate, repeatFrequency, repeatUnit
    ).filter(Boolean);

    if (!nextAssignmentDates.length) return;

    const userLeaves = await UserLeave.findAll({
      where: {
        userId,
        endDate: { [Op.gte]: nextAssignmentDates[0] },
        startDate: { [Op.lte]: nextAssignmentDates.at(-1) }
      },
    });

    const checkUserLeaveStatus = (date: string) => {
      return userLeaves.some(leave => 
        date >= leave.startDate && date <= leave.endDate
      );
    };

    const newAssignments = [];
    for (const date of nextAssignmentDates) {
      const isOnLeave = checkUserLeaveStatus(date);
      if (isOnLeave) {
        continue;
      }

      newAssignments.push({
        userId,
        locationId,
        date,
        startTime,
        endTime,
        templateId: this.id,
      });
    }

    await models.LocationAssignment.bulkCreate(newAssignments);
  }
}
