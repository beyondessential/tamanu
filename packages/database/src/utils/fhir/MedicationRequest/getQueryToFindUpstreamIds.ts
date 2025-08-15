import type { Models } from '../../../types/model';

export function getQueryToFindUpstreamIds(models: Models, table: string, id: string) {
  const {
    PharmacyOrderPrescription,
    PharmacyOrder,
    Prescription,
    ReferenceData,
    Encounter,
    Facility,
    Location,
    Patient,
    User,
  } = models;

  switch (table) {
    case PharmacyOrderPrescription.tableName:
      return { where: { id } };
    case Prescription.tableName:
      return {
        include: [
          {
            model: Prescription,
            as: 'prescription',
            required: true,
            where: { id },
          },
        ],
      };
    case ReferenceData.tableName:
      return {
        include: [
          {
            model: Prescription,
            as: 'prescription',
            required: true,
            include: [
              {
                model: ReferenceData,
                as: 'medication',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };
    case PharmacyOrder.tableName:
      return {
        include: [
          {
            model: PharmacyOrder,
            as: 'pharmacyOrder',
            required: true,
            where: { id },
          },
        ],
      };
    case User.tableName:
      return {
        include: [
          {
            model: PharmacyOrder,
            as: 'pharmacyOrder',
            required: true,
            include: [
              {
                model: User,
                as: 'orderingClinician',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };
    case Encounter.tableName:
      return {
        include: [
          {
            model: PharmacyOrder,
            as: 'pharmacyOrder',
            required: true,
            include: [
              {
                model: Encounter,
                as: 'encounter',
                required: true,
                where: { id },
              },
            ],
          },
        ],
      };
    case Patient.tableName:
      return {
        include: [
          {
            model: PharmacyOrder,
            as: 'pharmacyOrder',
            required: true,
            include: [
              {
                model: Encounter,
                as: 'encounter',
                required: true,
                include: [
                  {
                    model: Patient,
                    as: 'patient',
                    required: true,
                    where: { id },
                  },
                ],
              },
            ],
          },
        ],
      };
    case Facility.tableName:
      return {
        include: [
          {
            model: PharmacyOrder,
            as: 'pharmacyOrder',
            required: true,
            include: [
              {
                model: Encounter,
                as: 'encounter',
                required: true,
                include: [
                  {
                    model: Location,
                    as: 'location',
                    required: true,
                    include: [
                      {
                        model: Facility,
                        as: 'facility',
                        required: true,
                        where: { id },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };
    default:
      return null;
  }
}
