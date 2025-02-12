import { trace } from '@opentelemetry/api';
import ms from 'ms';
import { DataTypes, QueryTypes, Sequelize } from 'sequelize';

import { JOB_PRIORITIES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { log } from '@tamanu/shared/services/logging';
import { Model } from '../Model';
import type { InitOptions } from '../../types/model';

export class FhirJob extends Model {
  declare id: string;
  declare priority: number;
  declare status: string;
  declare worker_id?: string;
  declare started_at?: Date;
  declare completed_at?: Date;
  declare errored_at?: Date;
  declare error?: string;
  declare topic: string;
  declare discriminant: string;
  declare payload: Record<string, any>;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },

        // queue
        priority: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: JOB_PRIORITIES.DEFAULT,
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
          defaultValue: Sequelize.fn('gen_random_uuid'),
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

  static async backlogUntilLimit(topic: string, limit: number, includeDropped = true) {
    // Retrieving the size of the whole backlog can be expensive, and sometimes
    // we only need to check how many records can be retrieved up to a limit of
    // n, so this method returns the minimum of limit and backlog size
    const result = await this.sequelize.query<{ count: unknown }>(
      `SELECT fhir.job_backlog_until_limit($topic, $limit, $includeDropped) as count`,
      {
        type: QueryTypes.SELECT,
        bind: { topic, limit, includeDropped },
      },
    );
    return result?.[0]?.count;
  }

  static async grab(workerId: string, topic: string) {
    // We need to have strong isolation when grabbing, to avoid grabbing the
    // same job twice. But that runs the risk of failing due to serialization
    // failures, so we retry a few times, and add a bit of jitter to increase
    // our chances of success.

    const GRAB_RETRY = 10;
    for (let i = 0; i < GRAB_RETRY; i += 1) {
      try {
        return await this.sequelize.transaction(async () => {
          const result = await this.sequelize.query<{ id: string }>(
            'SELECT (fhir.job_grab($workerId, $topic)).job_id as id',
            {
              type: QueryTypes.SELECT,
              bind: { workerId, topic },
            },
          );
          const id = result?.[0]?.id;

          if (!id) return null;
          return FhirJob.findByPk(id);
        });
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

  static async submit(topic: string, payload = {}, { priority = 1000, discriminant = null } = {}) {
    const result = await this.sequelize.query<{ id: string }>(
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
    return result?.[0]?.id;
  }

  async start(workerId: string) {
    await this.sequelize.query('SELECT fhir.job_start($jobId, $workerId)', {
      type: QueryTypes.SELECT,
      bind: { jobId: this.id, workerId },
    });
  }

  async complete(workerId: string) {
    await this.sequelize.query('SELECT fhir.job_complete($jobId, $workerId)', {
      type: QueryTypes.SELECT,
      bind: { jobId: this.id, workerId },
    });
  }

  async fail(workerId: string, error: string) {
    await this.sequelize.query('SELECT fhir.job_fail($jobId, $workerId, $error)', {
      type: QueryTypes.SELECT,
      bind: { jobId: this.id, workerId, error },
    });
    await this.reload();
    return this;
  }
}
