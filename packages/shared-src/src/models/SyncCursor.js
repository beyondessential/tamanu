import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
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
        lastBeat: {
          type: Sequelize.BIGINT,
          defaultValue: 0,
        },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  static async useCursor(direction) {
    const { lastBeat } = await this.findOrCreate({ where: { direction } });

    const setCursor = async newCursorValue => {
      await this.update({ lastBeat: newCursorValue }, { where: { direction } });
    };

    return [lastBeat, setCursor];
  }

  static async useOutgoingCursor() {
    return this.useCursor(DIRECTIONS.OUTGOING);
  }

  static async useIncomingCursor() {
    return this.useCursor(DIRECTIONS.INCOMING);
  }
}
