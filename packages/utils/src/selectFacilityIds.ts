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
  return serverFacilityId ? [serverFacilityId] : serverFacilityIds ?? [];
};
