import { QueryInterface } from 'sequelize';

// DML only (spec: specs/sync/sensitive-networks.md).
//
// Sensitive facilities were islands: sync_lookup.facility_id was set to the facility's own id, and
// the outgoing snapshot admitted a row only when facility_id was null or the requesting facility's
// own. Two sensitive facilities therefore shared nothing. Giving each its own network of one
// preserves that exactly; pooling them into one shared network would newly expose each facility's
// confidential data to the others, which cannot be undone once synced.
//
// A facility's network is fixed once the facility exists, so an operator cannot merge these
// networks through the reference data import. Where a deployment genuinely wants two facilities
// sharing one network, that is a deliberate widening of confidentiality and is done as a named
// upgrade step (see mergeFijiSensitiveNetworks).
export async function up(query: QueryInterface): Promise<void> {
  // Derived from the facility code, so the id stays readable and the backfill stays deterministic.
  // Codes are unique in practice, and no deployment holding a sensitive facility has one carrying
  // the . or / that an id may not.
  await query.sequelize.query(`
    INSERT INTO sensitive_networks (id, code, name)
    SELECT 'sensitiveNetwork-' || code, code, name
    FROM facilities
    WHERE is_sensitive = TRUE
      AND deleted_at IS NULL;
  `);

  // Same derivation, so each facility pairs with the network just created from it.
  await query.sequelize.query(`
    UPDATE facilities
    SET sensitive_network_id = 'sensitiveNetwork-' || code
    WHERE is_sensitive = TRUE
      AND deleted_at IS NULL;
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

  // Bounded to the rows that actually hold a value: every facility touched here is re-stamped by
  // set_updated_at_sync_tick, so it re-queues for push to every facility server and mobile device
  // and triggers FHIR Organization rematerialisation.
  await query.sequelize.query(`
    UPDATE facilities
    SET sensitive_network_id = NULL
    WHERE sensitive_network_id IS NOT NULL;
  `);
  await query.sequelize.query(`DELETE FROM sensitive_networks;`);
}
