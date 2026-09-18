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
  // Every value here has to be unique, and only facilities.id can be relied on for that.
  //
  // The id is derived from the facility id rather than its code: a code admits . and /, which an
  // import rejects in an id, and stripping them is lossy — two distinct codes can collapse onto one
  // (A/B and AB) and a code of pure punctuation leaves a bare prefix.
  //
  // code and name are the facility's, but sensitive_networks holds both unique and facilities holds
  // neither, so two facilities may well share a name ("Central Clinic" in two divisions). Where a
  // value repeats among the facilities being backfilled, the facility id qualifies it.
  //
  // A collision either way fails the upgrade, and only on the deployments that happen to hold such
  // a facility. An administrator can rename any of this through the reference data import after.
  await query.sequelize.query(`
    INSERT INTO sensitive_networks (id, code, name)
    SELECT
      'sensitiveNetwork-' || id,
      CASE WHEN COUNT(*) OVER (PARTITION BY code) > 1 THEN code || '-' || id ELSE code END,
      CASE WHEN COUNT(*) OVER (PARTITION BY name) > 1 THEN name || ' (' || id || ')' ELSE name END
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
