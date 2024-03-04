import { Sequelize } from 'sequelize';

// Specifies the jsonb path without the first level (column name)
// path: ['a', 'b', '[]', 'c', '[]', 'd']
// jsonb path: '$.b[*].c[*].d'
export function getJsonbPath(path) {
  const actualPath = path.slice(1).map(step => (step === '[]' ? '[*]' : `.${step}`));
  return `$${actualPath.join('')}`;
}

// Depends on the appearance of an array in its last position
export function getJsonbQueryFn(path) {
  const lastElement = path[path.length - 1];
  const pathWithoutLastElement = path.slice(0, path.length - 1);
  const jsonbPath = getJsonbPath(pathWithoutLastElement);

  // path: ['a', 'b', '[]', 'c', '[]']
  // sql: jsonb_array_elements_text(jsonb_path_query(a, '$.b[*].c'))
  if (lastElement === '[]') {
    return Sequelize.fn(
      'jsonb_array_elements_text',
      Sequelize.fn('jsonb_path_query', Sequelize.col(path[0]), Sequelize.literal(`'${jsonbPath}'`)),
    );
  }

  // path: ['a', 'b', '[]', 'c', '[]', 'd']
  // sql: jsonb_extract_path_text(jsonb_path_query(a, '$.b[*].c[*]'), 'd')
  return Sequelize.fn(
    'jsonb_extract_path_text',
    Sequelize.fn('jsonb_path_query', Sequelize.col(path[0]), Sequelize.literal(`'${jsonbPath}'`)),
    lastElement,
  );
}
