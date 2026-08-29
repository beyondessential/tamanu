# Sync lookup: population + snapshot filtering for sensitive networks

Scenarios verifying that encounter data recorded at a networked facility reaches every facility in
that network and nowhere else. Spec: `specs/sync/sensitive-networks.md` (SENSNET).

Most of these need at least two facilities in one network plus a third outside it, which the existing
sensitive facility suite does not set up — it has one sensitive and one non-sensitive facility. That
fixture is the main new work.

## Population

- [ ] An encounter at a facility in a network gets that network on its lookup row, and no facility. verifies spec: SENSNET
- [ ] An encounter at a facility in no network gets neither a network nor a facility, so it reaches everywhere. verifies spec: SENSNET
- [ ] Records hanging off that encounter — note, diagnosis, procedure, task, vitals, administered vaccine, lab request — carry the same network as the encounter. verifies spec: SENSNET
- [ ] A notification whose metadata names an encounter at a networked facility carries that network. verifies spec: SENSNET
- [ ] An appointment at a networked facility keeps its facility and gets no network, so it reaches only that facility. verifies spec: SENSNET
- [ ] A patient facility link and a facility-scoped setting at a networked facility keep their facility and get no network. verifies spec: SENSNET
- [ ] Every model whose lookup query reaches encounters is network-scoped — the existing guard test, unchanged by this card.

## Snapshot filtering

- [ ] A facility in a network receives encounter data recorded at its sibling. verifies spec: SENSNET
- [ ] A facility outside a network does not receive that network's encounter data. verifies spec: SENSNET
- [ ] **A network-scoped row does not reach a facility outside the network.** This is the fail-open case: `facility_id IS NULL` alone used to mean "unscoped", and a network-scoped row also has a null facility. If the admission clause is not changed to require both columns null, every sensitive record syncs everywhere and no other test here catches it. verifies spec: SENSNET
- [ ] A record with neither a facility nor a network reaches every facility. verifies spec: SENSNET
- [ ] A record with a facility and no network reaches only that facility. verifies spec: SENSNET
- [ ] A session whose facilities belong to no network sees exactly what it sees today, with no network clause applied. verifies spec: SENSNET
- [ ] A session covering several facilities receives records scoped to any of them, and to any network they belong to. verifies spec: SENSNET
- [ ] A facility set to sync all lab requests still receives every lab request, including from a network it does not belong to. Existing behaviour, deliberately unchanged — pinning it so the change to the surrounding clause does not alter it by accident. verifies spec: SENSNET
- [ ] A facility receives its network's data only for patients it marks for sync. verifies spec: SENSNET
- [ ] An encounter moved from a networked facility to a facility in no network takes its records with it, including those recorded before the move, and they become visible to every facility. verifies spec: SENSNET

## Rescoping existing rows

- [ ] A lookup row scoped to a facility that belongs to a network gains that network and loses its facility. verifies spec: SENSNET
- [ ] Its sync tick is unchanged, so no facility re-pulls a record it already holds. verifies spec: SENSNET
- [ ] A row scoped to a facility deleted while it was sensitive keeps its facility and gains no network, so it still reaches nobody rather than everybody. verifies spec: SENSNET
- [ ] A row scoped to a facility for genuine facility binding — a patient facility link, a facility setting — is left alone. verifies spec: SENSNET
- [ ] On a deployment with no networked facility, nothing is rescoped. verifies spec: SENSNET
- [ ] After rescoping, a facility that was sensitive before networks existed receives exactly the records it received before. verifies spec: SENSNET

## Operational

- [ ] An incremental lookup build that rebuilds an already-network-scoped row leaves it network-scoped, covering a missing entry in the `ON CONFLICT DO UPDATE` list.
- [ ] Outgoing snapshot timing on a realistic `sync_lookup` is not materially worse with the network clause added.
- [ ] `EXPLAIN` on the snapshot query confirms which index it uses, before and after adding `sensitive_network_id` to the composite index. The query orders by `id`, which that index does not contain, so the planner may be using the primary key instead.
