import { DataTypes } from 'sequelize';
import { isEqual, parseISO } from 'date-fns';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { generateFutureAssignmentDates } from '@tamanu/utils/appointmentScheduling';
import {
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_VALUES,
  SYNC_DIRECTIONS,
  SYSTEM_USER_UUID,
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
    if (!this.sequelize.isInsideTransaction()) {
      throw new Error(
        'LocationAssignmentTemplate.generateRepeatingLocationAssignments must always run inside a transaction',
      );
    }

    const latestAssignment = await models.LocationAssignment.findOne({
      where: {
        templateId: this.id,
      },
      order: [['date', 'DESC']]
    });

    if (!latestAssignment) {
      throw new Error(
        'Cannot find existing assignments within the schedule',
      );
    }

    const {
      repeatFrequency,
      repeatUnit,
      repeatEndDate,
      userId,
      locationId,
      startTime,
      endTime,
    } = this;

    if (repeatEndDate && isEqual(parseISO(latestAssignment.date), parseISO(repeatEndDate))) {
      return;
    }

    const nextAssignmentDates = generateFutureAssignmentDates(
      latestAssignment.date, repeatFrequency, repeatUnit, repeatEndDate, maxGenerationMonths
    ).filter(date => date !== null);

    if (!nextAssignmentDates.length) return;

    await models.LocationAssignment.bulkCreate(
      nextAssignmentDates.map((date: string) => ({
        userId,
        locationId,
        date,
        startTime,
        endTime,
        templateId: this.id,
        createdBy: SYSTEM_USER_UUID,
        updatedBy: SYSTEM_USER_UUID,
      }))
    );
  }
}
