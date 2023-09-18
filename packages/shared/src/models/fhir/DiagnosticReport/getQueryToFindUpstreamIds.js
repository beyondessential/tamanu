import { Op } from 'sequelize';

export function fromLabTests(models, table, id) {
  const { Encounter, LabRequest, LabTest, LabTestType, Patient, ReferenceData, User } = models;

  switch (table) {
    case LabTest.tableName:
      return { where: { id } };
    case LabRequest.tableName:
      return { where: { labRequestId: id } };
    case LabTestType.tableName:
      return { where: { labTestTypeId: id } };
    case Encounter.tableName:
      return {
        include: [
          {
            model: LabRequest,
            as: 'labRequest',
            required: true,
            where: { encounterId: id },
          },
        ],
      };
    case Patient.tableName:
      return {
        include: [
          {
            model: LabRequest,
            as: 'labRequest',
            required: true,
            include: [
              {
                model: Encounter,
                as: 'encounter',
                required: true,
                where: { patientId: id },
              },
            ],
          },
        ],
      };
    case User.tableName:
      return {
        include: [
          {
            model: LabRequest,
            as: 'labRequest',
            required: true,
            include: [
              {
                model: Encounter,
                as: 'encounter',
                required: true,
                where: { examinerId: id },
              },
            ],
          },
        ],
      };
    case ReferenceData.tableName:
      return {
        include: [
          {
            model: ReferenceData,
            as: 'category',
            required: true,
          },
          {
            model: ReferenceData,
            as: 'labTestMethod',
            required: true,
          },
          {
            model: LabRequest,
            as: 'labRequest',
            required: true,
            include: [
              {
                model: ReferenceData,
                as: 'laboratory',
                required: true,
              },
            ],
          },
        ],
        where: {
          [Op.or]: [
            { '$category.id$': id },
            { '$labTestMethod.id$': id },
            { '$labRequest.laboratory.id$': id },
          ],
        },
      };
    default:
      return null;
  }
}
