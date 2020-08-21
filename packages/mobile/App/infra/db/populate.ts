
export async function needsInitialPopulation(models): boolean {
  // TODO: this should check against something more reasonable
  const allPrograms = await models.Program.find({});
  if(allPrograms.length === 0) {
    return true;
  }

  return false;
}

export async function populateInitialData(models) {
  const { Program } = models;

  console.log("Populating initial database");

  // TODO: should load from a fixture or trigger an initial sync
  const programs = [
    { name: "Dummy program 1" },
    { name: "Second dummy program" },
    { name: "DP3" },
  ];

  await Promise.all(programs.map(data => {
    const p = new Program();
    p.name = data.name;
    return p.save();
  }));
}
