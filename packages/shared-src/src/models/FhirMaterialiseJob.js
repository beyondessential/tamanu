import Sequelize, { Op, DataTypes, QueryTypes } from 'sequelize';
import { log } from 'shared/services/logging';
import { Model } from './Model';
import { JOB_QUEUE_STATUSES, SYNC_DIRECTIONS } from '../constants';

const TIMEOUT = '10 minutes';

const PENDING_RECORDS_WHERE = {
  [Op.or]: [
    { status: JOB_QUEUE_STATUSES.QUEUED },
    {
      status: JOB_QUEUE_STATUSES.STARTED,
      startedAt: { [Op.lte]: Sequelize.literal(`current_timestamp(3) - '${TIMEOUT}'::interval`) },
    },
  ],
};

// postgres doesn't support `UPDATE ... LIMIT n;` so we work around the limitation
const UPDATE_SQL = `
UPDATE fhir_materialise_jobs
SET status = 'Started', started_at = current_timestamp(3)
WHERE id IN (
  SELECT id
  FROM fhir_materialise_jobs
  WHERE deleted_at IS NULL
  AND (
    status = 'Queued'
    OR (
      status = 'Started'
      AND started_at <= current_timestamp(3) - '${TIMEOUT}'::interval
    )
  )
  LIMIT :limit
)
RETURNING id, resource, upstream_id AS "upstreamId";
`;

export class FhirMaterialiseJob extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
        },

        // queue-related fields
        status: {
          type: DataTypes.STRING,
          defaultValue: JOB_QUEUE_STATUSES.QUEUED,
          allowNull: false,
          validate: {
            isIn: [Object.values(JOB_QUEUE_STATUSES)],
          },
        },
        startedAt: DataTypes.DATE,
        completedAt: DataTypes.DATE,
        erroredAt: DataTypes.DATE,
        error: DataTypes.TEXT,

        // data fields
        upstreamId: DataTypes.STRING,
        resource: DataTypes.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
        indexes: [
          {
            unique: 'true',
            fields: ['upstreamId', 'resource'],
            where: { status: JOB_QUEUE_STATUSES.QUEUED },
          },
        ],
      },
    );
  }

  static async enqueue(job) {
    await this.enqueueMultiple([job]);
  }

  static async enqueueMultiple(jobs) {
    log.debug('FhirMaterialiseJob: Enqueuing jobs', {
      count: jobs.length,
      jobs: JSON.stringify(jobs),
    });
    await this.bulkCreate(
      jobs.map(({ upstreamId, resource }) => ({
        upstreamId,
        resource,
        status: JOB_QUEUE_STATUSES.QUEUED,
      })),
      { ignoreDuplicates: true },
    );
  }

  static async lockAndRun(limit, fn) {
    if (!Number.isFinite(limit)) {
      throw new Error('FhirMaterialiseJob: limit must be a number, and finite');
    }
    if (typeof fn !== 'function') {
      throw new Error('FhirMaterialiseJob: fn must be a function');
    }
    const [jobs] = await this.sequelize.query(UPDATE_SQL, {
      type: QueryTypes.UPDATE,
      replacements: { limit },
    });
    const completed = [];
    const failed = [];
    log.debug('FhirMaterialiseJob.lockAndRun: running jobs', {
      count: jobs.length,
      jobIds: JSON.stringify(jobs),
    });
    for (const job of jobs) {
      try {
        await fn(job);
        await this.update(
          {
            status: JOB_QUEUE_STATUSES.COMPLETED,
            completedAt: Sequelize.fn('current_timestamp', 3),
          },
          {
            where: { id: job.id },
          },
        );
        completed.push(job);
      } catch (e) {
        await this.update(
          {
            status: JOB_QUEUE_STATUSES.ERRORED,
            erroredAt: Sequelize.fn('current_timestamp', 3),
            error: e?.stack || e?.message || 'Unknown error',
          },
          {
            where: { id: job.id },
          },
        );
        failed.push(job);
      }
    }
    return [completed, failed];
  }

  static async countQueued() {
    return this.count({ where: PENDING_RECORDS_WHERE });
  }
}
