# U6 — test cases

Covers the data model and the migration of existing sensitive facilities. Membership-change rules
(assign, remove, move) are specified in the same spec but enforced by T6, so their cases live there.

## Migrating existing sensitive facilities

- [ ] A deployment with two sensitive facilities upgrades to two networks, one per facility, each
      taking that facility's code and name (verifies spec: SENSNET)
- [ ] A deployment with no sensitive facilities gains no networks (verifies spec: SENSNET)
- [ ] A facility that was soft-deleted while sensitive gains no network (verifies spec: SENSNET)
- [ ] A previously sensitive facility pulls the same set of records after the upgrade as before it,
      and in particular still pulls none of another previously sensitive facility's records. This
      is the case that catches a shared-network backfill slipping back in (verifies spec: SENSNET)
- [ ] An ordinary facility's pull is unchanged by the upgrade

## Schema

- [ ] A facility can be assigned a network and read back through the association
- [ ] A facility with no network reads back null, and is treated as not sensitive
- [ ] Two networks cannot share a code, and cannot share a name (verifies spec: SENSNET)
- [ ] A network requires both a code and a name (verifies spec: SENSNET)
- [ ] `sync_lookup` accepts and indexes a sensitive network id (verifies spec: SENSNET)
- [ ] Networks pull from central to a facility server and are not pushed back (verifies spec: SENSNET)
- [ ] A facility and its network arriving in one sync batch apply in dependency order, so the
      facility never lands before the network it references

## Deleting a network

- [ ] Deleting a network that has a member facility is refused (verifies spec: SENSNET)
- [ ] Deleting a network with no members succeeds (verifies spec: SENSNET)
- [ ] A network left empty by its only member moving elsewhere can be deleted (verifies spec: SENSNET)

## Facility access

- [ ] With no facility in any network, a user who may access all non-sensitive facilities reaches
      every facility without enumeration (verifies spec: SENSNET)
- [ ] With one facility in a network, that same user reaches every non-networked facility plus
      their explicitly linked facilities (verifies spec: SENSNET)
- [ ] A user explicitly linked to one member of a network gains no access to its siblings
      (verifies spec: SENSNET)
- [ ] A user restricted to explicit links reaches those facilities whether or not they are networked
- [ ] Mobile resolves all of the above identically to the server (verifies spec: SENSNET)

## Mobile

- [ ] A mobile device upgrading from a build with `facilities.isSensitive` ends up with the network
      table and the facility's membership column, and no `isSensitive`
- [ ] A fresh mobile install reaches the same schema as an upgraded one
- [ ] A mobile device pulls network reference data and stores facility membership (verifies spec: SENSNET)

## Operational

- [ ] The regenerated dbt models under `database/model/` carry no outstanding TODOs
- [ ] Migrating down from the full set restores a working schema, with the loss of network
      assignments recorded as destructive
