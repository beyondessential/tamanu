import { QueryInterface } from 'sequelize';

export async function up(query: QueryInterface) {
  // Update any translated strings that contain "Route of admission" to "Route of administration"
  // specifically for medication-related string IDs
  await query.sequelize.query(`
    UPDATE translated_strings 
    SET text = REPLACE(text, 'Route of admission', 'Route of administration')
    WHERE (string_id = 'medication.route.label' OR string_id = 'medication.property.route')
    AND text LIKE '%Route of admission%'
  `);
}

export async function down(query: QueryInterface) {
  // Revert the change by updating "Route of administration" back to "Route of admission"
  // for medication-related string IDs
  await query.sequelize.query(`
    UPDATE translated_strings 
    SET text = REPLACE(text, 'Route of administration', 'Route of admission')
    WHERE (string_id = 'medication.route.label' OR string_id = 'medication.property.route')
    AND text LIKE '%Route of administration%'
  `);
}