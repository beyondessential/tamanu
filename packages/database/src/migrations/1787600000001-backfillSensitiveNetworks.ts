import { QueryInterface } from 'sequelize';

// DML only (spec: specs/sync/sensitive-networks.md).
//
// Sensitive facilities were islands: sync_lookup.facility_id was set to the facility's own id, and
// the outgoing snapshot admitted a row only when facility_id was null or the requesting facility's
// own. Two sensitive facilities therefore shared nothing. Giving each its own network of one
// preserves that exactly; pooling them into one shared network would newly expose each facility's
// confidential data to the others, which cannot be undone once synced.
//
// There is no way to merge these networks afterwards: a facility's network is fixed when the
// facility is created, so an operator who wants two facilities in one network stands up a new
// facility enrolled in it.
export async function up(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`
    INSERT INTO sensitive_networks (id, code, name)
    SELECT gen_random_uuid(), code, name
    FROM facilities
    WHERE is_sensitive = TRUE
      AND deleted_at IS NULL;
  `);

  // Facility code is unique and the networks were just created from it, so this pairs each
  // facility with its own network.
  await query.sequelize.query(`
    UPDATE facilities
    SET sensitive_network_id = sensitive_networks.id
    FROM sensitive_networks
    WHERE facilities.code = sensitive_networks.code
      AND facilities.is_sensitive = TRUE
      AND facilities.deleted_at IS NULL;
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  // DESTRUCTIVE: networks created by an administrator after this migration ran, and any facility
  // assigned to one, are dropped along with the backfilled networks of one. is_sensitive is
  // restored only for facilities that currently belong to a network.
  await query.sequelize.query(`
    UPDATE facilities
    SET is_sensitive = TRUE
    WHERE sensitive_network_id IS NOT NULL;
  `);

  await query.sequelize.query(`UPDATE facilities SET sensitive_network_id = NULL;`);
  await query.sequelize.query(`DELETE FROM sensitive_networks;`);
}
