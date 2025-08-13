import { DataTypes, Op } from 'sequelize';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { generateFutureAssignmentDates } from '@tamanu/utils/appointmentScheduling';
import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_VALUES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
  LOCATION_ASSIGNMENT_STATUS,
} from '@tamanu/constants';
import type { ReadSettings } from '@tamanu/settings/reader';

export class LocationAssignmentTemplate extends Model {
  declare id: string;
  declare userId: string;
  declare locationId: string;
  declare date: string;
  declare startTime: string;
  declare endTime: string;
  declare repeatEndDate?: string;
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
          allowNull: true,
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
    return null; // syncs everywhere
  }

  static buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }

  /**
   * Generate repeating location assignments
   */
  async generateRepeatingLocationAssignments(
    settings: ReadSettings
  ) {
    const maxGenerationMonths = await settings.get(
      'locationAssignments.maxViewableMonthsAhead' as any,
    ) as number;

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
      repeatEndDate,
      userId,
      locationId,
      startTime,
      endTime,
    } = this;

    if (latestAssignment && latestAssignment.date === repeatEndDate) {
      return;
    }

    const startDate = latestAssignment?.date || this.date;
    const nextAssignmentDates = generateFutureAssignmentDates(
      startDate, repeatFrequency, repeatUnit, repeatEndDate, maxGenerationMonths
    ).filter(date => date !== null);

    const userLeaves = await UserLeave.findAll({
      where: {
        userId,
        removedAt: null,
        endDate: { [Op.gte]: startDate },
        startDate: { [Op.lte]: nextAssignmentDates.at(-1) }
      },
    });

     // if there is no assignment, add the first date
    if (!latestAssignment) {
      nextAssignmentDates.push(this.date);
    }

    if (!nextAssignmentDates.length) return;

    const checkUserLeaveStatus = (date: string) => {
      return userLeaves.some(leave => 
        date >= leave.startDate && date <= leave.endDate
      );
    };

    const newAssignments = nextAssignmentDates.map((date: string) => {
      const isOnLeave = checkUserLeaveStatus(date);

      return {
        userId,
        locationId,
        date,
        startTime,
        endTime,
        status: isOnLeave ? LOCATION_ASSIGNMENT_STATUS.INACTIVE : LOCATION_ASSIGNMENT_STATUS.ACTIVE,
        deactivationReason: isOnLeave ? 'user_on_leave' : undefined,
        templateId: this.id,
        createdBy: SYSTEM_USER_UUID,
        updatedBy: SYSTEM_USER_UUID,
      }
    });

    await models.LocationAssignment.bulkCreate(newAssignments);
  }
}
