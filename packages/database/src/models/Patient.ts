import { Op, Sequelize } from 'sequelize';
import { Model } from './Model';
import type { PatientAdditionalData } from './PatientAdditionalData';

export class Patient extends Model {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  culturalName?: string;
  additionalData?: PatientAdditionalData[];
  sex!: string;
  dateOfBirth?: string;
  dateOfDeath?: string;
  displayId!: string;
  visibilityStatus?: string;
  mergedIntoId?: string;

  /** Patient this one was merged into (end of the chain) */
  async getUltimateMergedInto() {
    return (this.constructor as typeof Patient).findOne({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_up', this.id)) },
          { id: { [Op.ne]: this.id } },
          { mergedIntoId: null },
        ],
      },
    });
  }

  /** Patients this one was merged into */
  async getMergedUp() {
    return (this.constructor as typeof Patient).findAll({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_up', this.id)) },
          { id: { [Op.ne]: this.id } },
        ],
      },
    });
  }

  /** Patients that were merged into this one */
  async getMergedDown() {
    return (this.constructor as typeof Patient).findAll({
      where: {
        [Op.and]: [
          { id: Sequelize.fn('any', Sequelize.fn('patients_merge_chain_down', this.id)) },
          { id: { [Op.ne]: this.id } },
        ],
      },
    });
  }
}
