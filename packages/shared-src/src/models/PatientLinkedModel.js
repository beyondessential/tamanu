import { Op } from 'sequelize';
import { Model } from './Model';

export class PatientLinkedModel extends Model {
  static buildSyncFilter(patientIds) {
    return {
      where: { patientId: { [Op.in]: patientIds } },
    };
  }
}
