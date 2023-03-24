import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, TEMPLATE_TYPES } from 'shared/constants';
import { Model } from './Model';

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
