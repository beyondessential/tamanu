import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, TEMPLATE_TYPES } from 'shared/constants';
import { Model } from './Model';
import { dateType } from './dateTimeTypes';
import { getCurrentDateString } from '../utils/dateTime';

export class Template extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        templateType: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        date_created: dateType('date_created', {
          allowNull: false,
          defaultValue: getCurrentDateString,
        }),
        title: {
          type: Sequelize.STRING,
        },
        body: {
          type: Sequelize.STRING,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        validate: {
          mustHaveValidTemplateType() {
            if (!Object.values(TEMPLATE_TYPES).includes(this.recordType)) {
              throw new Error(`Template: Must have a valid template type (got ${this.recordType})`);
            }
          },
        },
      },
    );
  }
}
