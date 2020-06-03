import { VISIT_TYPES } from 'shared/constants';
import { Sequelize, Op } from 'sequelize';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class Triage extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,

        arrivalTime: Sequelize.DATE,
        triageTime: Sequelize.DATE,
        closedTime: Sequelize.DATE,

        score: Sequelize.TEXT,
      },
      options,
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Visit, {
      foreignKey: 'visitId',
    });

    this.belongsTo(models.User, {
      as: 'Practitioner',
      foreignKey: 'practitionerId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'chiefComplaintId',
    });

    this.belongsTo(models.ReferenceData, {
      foreignKey: 'secondaryComplaintId',
    });
  }

  static async create(data) {
    const { Visit, ReferenceData } = this.sequelize.models;

    const existingVisit = await Visit.findOne({
      where: {
        endDate: {
          [Op.is]: null,
        },
        patientId: data.patientId,
      },
    });

    if (existingVisit) {
      throw new InvalidOperationError("Can't triage a patient that has an existing visit");
    }

    const reasons = await Promise.all(
      [data.chiefComplaintId, data.secondaryComplaintId].map(x => ReferenceData.findByPk(x)),
    );

    const reasonsText = reasons
      .filter(x => x)
      .map(x => x.name)
      .join(' and ');
    const reasonForVisit = `Presented at emergency department with ${reasonsText}`;

    // TODO: use emergency department by default
    const department = await ReferenceData.findOne({ type: 'department' });

    return this.sequelize.transaction(async () => {
      const visit = await Visit.create({
        visitType: VISIT_TYPES.TRIAGE,
        startDate: data.triageTime || new Date(),
        reasonForVisit,
        patientId: data.patientId,
        departmentId: department.id,
        locationId: data.locationId,
        examinerId: data.practitionerId,
      });

      return super.create({
        ...data,
        visitId: visit.id,
      });
    });
  }
}
