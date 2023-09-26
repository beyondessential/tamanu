export async function up(query) {
  await query.sequelize.query(`
    UPDATE public.report_definition_versions set 
    query_options = jsonb_set(query_options::jsonb, '{defaultDateRange}', '"past30Days"') 
    where query_options::jsonb ->> 'defaultDateRange' = '30days'
  `);
}

export async function down(query) {
  await query.sequelize.query(`
    UPDATE public.report_definition_versions set 
    query_options = jsonb_set(query_options::jsonb, '{defaultDateRange}', '"30days"') 
    where query_options::jsonb ->> 'defaultDateRange' = 'past30Days'
  `);
}
