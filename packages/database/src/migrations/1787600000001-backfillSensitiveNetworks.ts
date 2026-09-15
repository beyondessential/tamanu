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
  // Derived from the facility id, not its code. The id is already constrained to the characters an
  // import allows, so it needs no transform; a code admits . and /, and stripping those to make it
  // safe is lossy, so two distinct codes can collapse onto one id (A/B and AB) and a code of pure
  // punctuation yields a bare prefix. Either collides on the primary key and fails the upgrade,
  // and only on the deployments that happen to hold such a code.
  await query.sequelize.query(`
    INSERT INTO sensitive_networks (id, code, name)
    SELECT 'sensitiveNetwork-' || id, code, name
    FROM facilities
    WHERE is_sensitive = TRUE
      AND deleted_at IS NULL;
  `);

  // Same derivation, so each facility pairs with the network just created from it.
  await query.sequelize.query(`
    UPDATE facilities
    SET sensitive_network_id = 'sensitiveNetwork-' || id
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

  await query.sequelize.query(`UPDATE facilities SET sensitive_network_id = NULL;`);
  await query.sequelize.query(`DELETE FROM sensitive_networks;`);
}
