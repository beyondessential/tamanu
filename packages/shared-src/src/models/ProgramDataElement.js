import { Sequelize } from 'sequelize';
import { PROGRAM_DATA_ELEMENT_TYPE_VALUES, SYNC_DIRECTIONS } from 'shared/constants';
import { parseOrNull } from 'shared/utils/parse-or-null';
import { Model } from './Model';

export class ProgramDataElement extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        code: Sequelize.STRING,
        name: Sequelize.STRING,
        indicator: Sequelize.STRING,
        defaultText: Sequelize.STRING,
        defaultOptions: Sequelize.STRING,
        type: Sequelize.ENUM(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  forResponse() {
    const { defaultOptions, ...values } = this.dataValues;
    return {
      ...values,
      defaultOptions: parseOrNull(defaultOptions),
    };
  }

  static syncDirection = SYNC_DIRECTIONS.READ_ONLY;
}
