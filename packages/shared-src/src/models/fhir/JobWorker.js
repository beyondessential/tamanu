import Sequelize, { DataTypes, QueryTypes } from 'sequelize';
import { Model } from '../Model';
import { SYNC_DIRECTIONS } from '../../constants';

export class FhirJobWorker extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
          defaultValue: Sequelize.fn('uuid_generate_v4'),
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
    const [{ id }] = await this.sequelize.query(
      'SELECT fhir.job_worker_register($metadata) as id',
      {
        type: QueryTypes.SELECT,
        bind: { metadata },
      },
    );

    return FhirJobWorker.findByPk(id);
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
}
