export function filterFromLabRequests(models, table) {
  const { LabRequest } = models;

  switch (table) {
    case LabRequest.tableName:
      return {
        where: {
          specimenAttached: true,
        },
      };
    default:
      return null;
  }
}
