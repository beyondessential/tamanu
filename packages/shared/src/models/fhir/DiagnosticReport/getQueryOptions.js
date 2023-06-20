export function getQueryOptions(models) {
  const { LabRequest, LabTestType, ReferenceData, Encounter, Patient, User, LabTest } = models;

  const labTestOptions = {
    include: [
      {
        model: LabRequest,
        as: 'labRequest',
        include: [
          {
            model: ReferenceData,
            as: 'laboratory',
          },
          {
            model: Encounter,
            as: 'encounter',
            include: [
              {
                model: Patient,
                as: 'patient',
              },
              {
                model: User,
                as: 'examiner',
              },
            ],
          },
        ],
      },
      {
        model: LabTestType,
        as: 'labTestType',
      },
      {
        model: ReferenceData,
        as: 'labTestMethod',
      },
    ],
  };

  return {
    [LabTest.tableName]: labTestOptions,
  };
}
