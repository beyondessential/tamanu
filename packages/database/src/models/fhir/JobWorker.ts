import Sequelize, { DataTypes, QueryTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from '../Model';
import type { InitOptions } from '../../types/model';

export class FhirJobWorker extends Model {
  declare id: string;
  declare metadata: Record<string, any>;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
          defaultValue: Sequelize.fn('gen_random_uuid'),
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
        },
      },
      {
        ...options,
        schema: 'fhir',
        tableName: 'job_workers',
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static async register(metadata = {}) {
    const result = await this.sequelize.query<{ id: string }>(
      'SELECT fhir.job_worker_register($metadata) as id',
      {
        type: QueryTypes.SELECT,
        bind: { metadata },
      },
    );

    return FhirJobWorker.findByPk(result?.[0]?.id);
  }

  static async clearDead() {
    await this.sequelize.query('SELECT fhir.job_worker_garbage_collect()');
  }

  async heartbeat() {
    await this.sequelize.query('SELECT fhir.job_worker_heartbeat($workerId)', {
      type: QueryTypes.SELECT,
      bind: { workerId: this.id },
    });
  }

  async deregister() {
    await this.sequelize.query('SELECT fhir.job_worker_deregister($workerId)', {
      type: QueryTypes.SELECT,
      bind: { workerId: this.id },
    });
  }

  async markAsHandling(topic: string) {
    const topics = this.metadata.topics || [];
    await this.update({
      metadata: {
        ...this.metadata,
        topics: [...topics, topic],
      },
    });
  }

  async recordSuccess() {
    await this.update({
      metadata: {
        ...this.metadata,
        lastSuccessfulJobTimestamp: new Date(),
        successfulJobs: (this.metadata.successfulJobs || 0) + 1,
        totalJobs: (this.metadata.totalJobs || 0) + 1,
      },
    });
  }

  async recordFailure() {
    await this.update({
      metadata: {
        ...this.metadata,
        failedJobs: (this.metadata.failedJobs || 0) + 1,
        totalJobs: (this.metadata.totalJobs || 0) + 1,
      },
    });
  }
}
