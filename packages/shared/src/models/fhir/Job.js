import { trace } from '@opentelemetry/api';
import ms from 'ms';
import Sequelize, { DataTypes, QueryTypes, Transaction } from 'sequelize';

import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import { log } from '../../services/logging';
import { sleepAsync } from '../../utils/sleepAsync';

export class FhirJob extends Model {
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
        schema: 'fhir',
        tableName: 'jobs',
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
      'SELECT fhir.job_backlog($topic, $includeDropped) as count',
      {
        type: QueryTypes.SELECT,
        bind: { topic, includeDropped },
      },
    );
    return Number(count);
  }

  static async grab(workerId, topic) {
    // We need to have strong isolation when grabbing, to avoid grabbing the
    // same job twice. But that runs the risk of failing due to serialization
    // failures, so we retry a few times, and add a bit of jitter to increase
    // our chances of success.

    const GRAB_RETRY = 10;
    for (let i = 0; i < GRAB_RETRY; i += 1) {
      try {
        return await this.sequelize.transaction(
          {
            isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
          },
          async () => {
            const [{ id }] = await this.sequelize.query(
              'SELECT (fhir.job_grab($workerId, $topic)).job_id as id',
              {
                type: QueryTypes.SELECT,
                bind: { workerId, topic },
              },
            );

            if (!id) return null;
            return FhirJob.findByPk(id);
          },
        );
      } catch (err) {
        log.debug(`Failed to grab job`, err);

        // retry, with a bit of jitter to avoid thundering herd
        const delay = Math.floor(Math.random() * 500);

        // eslint-disable-next-line no-unused-expressions
        trace.getActiveSpan()?.addEvent('grab retry', { delay, attempt: i + 1 });
        log.debug(`Failed to grab job, retrying in ${ms(delay)} (${i + 1}/${GRAB_RETRY})`);

        if (i > GRAB_RETRY / 2) {
          log.warn(`Failed to grab job after ${i + 1} retries, this is unusual`);
        }

        await sleepAsync(delay);
        continue;
      }
    }

    throw new Error(`Failed to grab job after ${GRAB_RETRY} retries`);
  }

  static async submit(topic, payload = {}, { priority = 1000, discriminant = null } = {}) {
    const [{ id }] = await this.sequelize.query(
      `
      SELECT fhir.job_submit(
          $topic
        , $payload
        , $priority
        ${discriminant ? ', $discriminant' : ''}
      ) as id
    `,
      {
        type: QueryTypes.SELECT,
        bind: { topic, payload, priority, discriminant },
      },
    );
    return id;
  }

  async start(workerId) {
    await this.sequelize.query('SELECT fhir.job_start($jobId, $workerId)', {
      type: QueryTypes.SELECT,
      bind: { jobId: this.id, workerId },
    });
  }

  async complete(workerId) {
    await this.sequelize.query('SELECT fhir.job_complete($jobId, $workerId)', {
      type: QueryTypes.SELECT,
      bind: { jobId: this.id, workerId },
    });
  }

  async fail(workerId, error) {
    await this.sequelize.query('SELECT fhir.job_fail($jobId, $workerId, $error)', {
      type: QueryTypes.SELECT,
      bind: { jobId: this.id, workerId, error },
    });
    await this.reload();
    return this;
  }
}
