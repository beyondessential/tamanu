import { Op } from 'sequelize';
import { Model } from './Model';

export class EncounterLinkedModel extends Model {
  static buildSyncFilter(patientIds) {
    return {
      where: { '$encounter.patient_id$': { [Op.in]: patientIds } },
      include: ['encounter'],
    };
  }
}
