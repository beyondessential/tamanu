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
            include: [
              {
                model: Encounter,
                as: 'encounter',
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
            include: [
              {
                model: Encounter,
                as: 'encounter',
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
          },
          {
            model: ReferenceData,
            as: 'labTestMethod',
          },
          {
            model: LabRequest,
            as: 'labRequest',
            include: [
              {
                model: ReferenceData,
                as: 'laboratory',
              },
            ],
          },
        ],
        where: {
          [Op.or]: [
            { '$category.id$': id },
            { '$labTestMethod.id$': id },
            { '$laboratory.id$': id },
          ],
        },
      };
    default:
      return null;
  }
}
