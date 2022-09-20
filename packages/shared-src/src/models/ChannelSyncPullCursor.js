import { Sequelize } from 'sequelize';
import config from 'config';
import { chunk } from 'lodash';

import { Model } from './Model';

const CURSOR_BATCH_SIZE = 10000; // number of channels to query at once

export class ChannelSyncPullCursor extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        channel: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        pullCursor: {
          type: Sequelize.STRING,
          defaultValue: '0',
        },
      },
      {
        ...options,
        indexes: [
          {
            unique: true,
            fields: ['channel'],
          },
        ],
      },
    );
  }

  static async getCursors(channels) {
    let cursors = [];
    for (const channelBatch of chunk(channels, CURSOR_BATCH_SIZE)) {
      const cursorBatch = await this.sequelize.query(
        `
        SELECT
          text_channel AS channel,
          CASE
            WHEN channel_sync_pull_cursors.pull_cursor IS NULL THEN '0'
            ELSE channel_sync_pull_cursors.pull_cursor
          END AS cursor
        FROM unnest(ARRAY[:channelBatch]::text[]) AS text_channel
        LEFT OUTER JOIN channel_sync_pull_cursors ON channel_sync_pull_cursors.channel = text_channel
        `,
        {
          replacements: { channelBatch },
          raw: true,
          type: Sequelize.QueryTypes.SELECT,
        },
      );
      cursors = [...cursors, ...cursorBatch];
    }
    return cursors;
  }
}
