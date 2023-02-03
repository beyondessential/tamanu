import Sequelize, { DataTypes, QueryTypes } from 'sequelize';
import { Model } from './Model';
import { Job } from './Job';
import { SYNC_DIRECTIONS } from '../constants';

export class JobWorker extends Model {
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
        syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC,
      },
    );
  }

  static async register(metadata) {
    const [{ workerId }] = await this.sequelize.query('SELECT job_worker_register($metadata)', {
      type: QueryTypes.SELECT,
      bind: { metadata },
    });

    return JobWorker.findByPk(workerId);
  }
 
  static async clearDead() {
    await this.sequelize.query('SELECT job_worker_garbage_collect()');
  }
  
  async heartbeat() {
    await this.sequelize.query('SELECT job_worker_heartbeat($workerId)', {
      type: QueryTypes.SELECT,
      bind: { workerId: this.id },
    });
  }
  
  async deregister() {
    await this.sequelize.query('SELECT job_worker_deregister($workerId)', {
      type: QueryTypes.SELECT,
      bind: { workerId: this.id },
    });
  }

  grabJob(topic) {
    return Job.grab(this.id, topic);
  }
}
