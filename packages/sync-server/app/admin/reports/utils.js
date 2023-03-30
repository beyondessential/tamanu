import { QueryTypes } from 'sequelize';
import { getQueryReplacementsFromParams } from 'shared/utils/getQueryReplacementsFromParams';
import { InvalidOperationError } from 'shared/errors';

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

export async function verifyQuery({ query, queryOptions }, store) {
  const parameters = queryOptions?.parameters || [];
  try {
    // use EXPLAIN instead of PREPARE because we don't want to stuff around deallocating the statement
    await store.sequelize.query(`EXPLAIN ${query}`, {
      type: QueryTypes.SELECT,
      replacements: getQueryReplacementsFromParams(parameters),
    });
  } catch (err) {
    throw new InvalidOperationError(`Invalid query: ${err.message}`);
  }
}
