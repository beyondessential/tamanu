import Sequelize, { DataTypes, QueryTypes } from 'sequelize';
import { Model } from './Model';
import { SYNC_DIRECTIONS } from '../constants';

export class Job extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
        },

        // queue
        priority: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1000,
        },
        status: {
          type: DataTypes.TEXT,
          defaultValue: 'Queued',
          allowNull: false,
        },
        worker_id: DataTypes.UUID,
        started_at: DataTypes.DATE,
        completed_at: DataTypes.DATE,
        errored_at: DataTypes.DATE,
        error: DataTypes.TEXT,

        // routing
        topic: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        discriminant: {
          type: DataTypes.TEXT,
          allowNull: false,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
          unique: true,
        },

        // data
        payload: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [
          {
            fields: ['topic', 'status', 'priority', 'created_at'],
          },
        ],
      },
    );
  }

  static async backlog(topic, includeDropped = true) {
    const [{ count }] = await this.sequelize.query(
      'SELECT job_backlog($topic, $includeDropped) as count',
      {
        type: QueryTypes.SELECT,
        bind: { topic, includeDropped },
      },
    );
    return count;
  }

  static async grab(workerId, topic) {
    const job = await this.sequelize.query('SELECT job_grab($workerId, $topic)', {
      type: QueryTypes.SELECT,
      bind: { workerId, topic },
    });

    if (!job || !job[0]) {
      return null;
    }

    const { jobId } = job[0];
    return Job.findByPk(jobId);
  }

  static async submit(topic, payload, { priority = 1000, discriminant = null } = {}) {
    const [{ jobId }] = await this.sequelize.query(
      `
      SELECT job_submit(
          $topic
        , $payload
        , $priority
        ${discriminant ? ', $discriminant' : ''}
      )
    `,
      {
        type: QueryTypes.SELECT,
        bind: { topic, payload, priority, discriminant },
      },
    );
    return jobId;
  }

  async complete(workerId) {
    await this.sequelize.query('SELECT job_complete($jobId, $workerId)', {
      type: QueryTypes.SELECT,
      bind: { jobId: this.id, workerId },
    });
  }

  async error(workerId, error) {
    await this.sequelize.query('SELECT job_error($jobId, $workerId, $error)', {
      type: QueryTypes.SELECT,
      bind: { jobId: this.id, workerId, error },
    });
    await this.reload();
    return this;
  }
}
