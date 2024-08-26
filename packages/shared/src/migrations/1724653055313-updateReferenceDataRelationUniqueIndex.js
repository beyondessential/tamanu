/**
 * @param {import('sequelize').QueryInterface} query
 */
export async function up(query) {
  await query.removeConstraint(
    'reference_data_relations',
    'reference_data_relations_reference_data_id_type_key',
  );

  await query.addConstraint('reference_data_relations', {
    fields: ['reference_data_id', 'reference_data_parent_id', 'type'],
    type: 'unique',
    name: 'reference_data_relations_unique_index',
  });
}

/**
 * @param {import('sequelize').QueryInterface} query
 */
export async function down(query) {
  await query.removeConstraint('reference_data_relations', 'reference_data_relations_unique_index');

  await query.addConstraint('reference_data_relations', {
    fields: ['reference_data_id', 'type'],
    type: 'unique',
    name: 'reference_data_relations_reference_data_id_type_key',
  });
}
