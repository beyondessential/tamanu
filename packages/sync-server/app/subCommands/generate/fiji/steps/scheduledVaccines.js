export default {
  run: async store => {
    const { ReferenceData, ScheduledVaccine } = store.models;
    const [az] = await ReferenceData.upsert(
      {
        id: 'drug-COVAX',
        code: 'COVAX',
        name: 'COVID-19 (AZ)',
        type: 'drug',
      },
      { returning: true },
    );
    const scheduledVaccines = [];
    for (let dose = 1; dose <= 2; dose++) {
      const [scheduledVaccine] = await ScheduledVaccine.upsert(
        {
          id: `scheduledVaccine-COVID-19-Dose-${dose}`,
          category: 'Campaign',
          label: 'COVID-19',
          schedule: `Dose ${dose}`,
          weeksFromLastVaccinationDue: dose === 1 ? null : 8,
          index: dose,
          vaccineId: az.id,
        },
        { returning: true },
      );
      scheduledVaccines.push(scheduledVaccine);
    }
    return scheduledVaccines;
  },
};
