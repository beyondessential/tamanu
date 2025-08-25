import { DataTypes, Op } from 'sequelize';
import { Model } from './Model';
import { buildSyncLookupSelect } from '../sync/buildSyncLookupSelect';
import type { InitOptions, Models } from '../types/model';
import { generateFrequencyDates } from '@tamanu/utils/appointmentScheduling';
import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_VALUES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
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
  declare createdBy: string;
  declare updatedBy?: string;

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

    this.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'createdByUser',
    });

    this.belongsTo(models.User, {
      foreignKey: 'updatedBy',
      as: 'updatedByUser',
    });
  }

  static buildSyncFilter() {
    return `
      LEFT JOIN locations ON ${this.tableName}.location_id = locations.id
      WHERE locations.facility_id IN (:facilityIds) 
      AND ${this.tableName}.updated_at_sync_tick > :since
    `;
  }

  static buildSyncLookupQueryDetails() {
    return {
      select: buildSyncLookupSelect(this, {
        facilityId: 'locations.facility_id',
      }),
      joins: `
        LEFT JOIN locations ON ${this.tableName}.location_id = locations.id
      `,
    };
  }

  /**
   * Generate repeating location assignments
   */
  async generateRepeatingLocationAssignments() {
    const { models } = this.sequelize;
    const { UserLeave, LocationAssignment } = models;
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error(
        'LocationAssignmentTemplate.generateRepeatingLocationAssignments must always run inside a transaction',
      );
    }

    const latestAssignment = await LocationAssignment.findOne({
      where: {
        templateId: this.id,
      },
      order: [['date', 'DESC']]
    });

    const {
      repeatFrequency,
      repeatUnit,
      userId,
      locationId,
      startTime,
      endTime,
      repeatEndDate,
    } = this;

    const startDate = latestAssignment?.date || this.date;
    const nextAssignmentDates = generateFrequencyDates(
      startDate, repeatEndDate, repeatFrequency, repeatUnit
    ).filter(date => date !== null);

    if (latestAssignment) {
      nextAssignmentDates.shift();
    }

    if (!nextAssignmentDates.length) return;

    const userLeaves = await UserLeave.findAll({
      where: {
        userId,
        removedAt: null,
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
        createdBy: SYSTEM_USER_UUID,
        updatedBy: SYSTEM_USER_UUID,
      });
    }

    await models.LocationAssignment.bulkCreate(newAssignments);
  }
}
