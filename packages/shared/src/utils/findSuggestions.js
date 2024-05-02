import { literal, Op } from 'sequelize';

const MAX_SUGGESTIONS = 25;

export async function findSuggestions(
  model,
  searchQuery,
  searchColumn = 'name',
  findArguments = {},
) {
  const { replacements: extraReplacements, ...extraFindArguments } = findArguments;
  const modelName = model.name;
  const positionQuery = literal(
    `POSITION(LOWER(:positionMatch) in LOWER(${`"${modelName}"."${searchColumn}"`})) > 1`,
  );

  const results = await model.findAll({
    where: { name: { [Op.iLike]: `%${searchQuery}%` } },
    order: [positionQuery, [literal(`"${modelName}"."${searchColumn}"`), 'ASC']],
    replacements: {
      positionMatch: searchQuery,
      ...extraReplacements,
    },
    limit: MAX_SUGGESTIONS,
    ...extraFindArguments,
  });
  return results;
}
