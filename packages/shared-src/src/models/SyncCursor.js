import { Sequelize } from 'sequelize';

import { Model } from './Model';

const DIRECTIONS = {
  OUTGOING: 'outgoing',
  INCOMING: 'incoming',
};

export class SyncCursor extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        direction: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        cursor: {
          type: Sequelize.DATE,
          defaultValue: 0,
        },
      },
      options,
    );
  }

  static async useCursor(direction) {
    const { cursor } = await this.findOrCreate({ where: { direction } });

    const setCursor = async newCursorValue => {
      await this.update({ cursor: newCursorValue }, { where: { direction } });
    };

    return [cursor, setCursor];
  }

  static async useOutgoingCursor() {
    return this.useCursor(DIRECTIONS.OUTGOING);
  }

  static async useIncomingCursor() {
    return this.useCursor(DIRECTIONS.INCOMING);
  }
}
