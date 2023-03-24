export const sanitizeFilename = (reportName, versionNumber, format) => {
  const sanitizedName = reportName
    .trim()
    .replace(/[/?<>\\:*|"]/g, '')
    .replace(/(\s|-)+/g, '-')
    .toLowerCase();
  return `${sanitizedName}-v${versionNumber}.${format}`;
};

export const stripMetadata = (
  {
    id,
    versionNumber,
    query,
    queryOptions,
    createdAt,
    updatedAt,
    status,
    notes,
    reportDefinitionId,
    userId,
  },
  includeRelationIds = false,
) => ({
  id,
  versionNumber,
  query,
  queryOptions,
  createdAt,
  updatedAt,
  status,
  notes,
  ...(includeRelationIds && {
    reportDefinitionId,
    userId,
  }),
});
