export const selectFacilityIds = (config: {
  serverFacilityId?: string;
  serverFacilityIds?: string[];
}) => {
  const { serverFacilityId, serverFacilityIds } = config;
  if (serverFacilityId && serverFacilityIds) {
    throw new Error(
      'Both serverFacilityId and serverFacilityIds are set in config, a facility server should either have a single facility or multiple facilities, not both.',
    );
  }
  return serverFacilityId ? [serverFacilityId] : serverFacilityIds;
};

// Deploys are moving off config for this, so anything resolving facility ids has to
// read the env var first.
export const facilityIdsFromEnv = (): string[] | undefined => {
  const declared = process.env.TAMANU_FACILITY_IDS;
  if (!declared) return undefined;
  return [
    ...new Set(
      declared
        .split(',')
        .map(id => id.trim())
        .filter(Boolean),
    ),
  ];
};
