---
id: SENSNET
---

# Sensitive networks

A sensitive network is a named group of facilities that share confidential data. Data recorded at a facility in a network reaches every facility in that network and nowhere else, while data recorded at a facility outside any network syncs normally. A facility holding confidential data on its own is a network of one.

## The network record

- [ ] A sensitive network is identified by an id and carries a code and a name, both required. Each is unique across networks, as a facility's are.
- [ ] Networks are reference data, defined on the central server and pulled down to facility servers and mobile devices. They are never pushed upwards.
- [ ] Networks carry the record lifecycle fields every synced Tamanu record has: creation and update timestamps, soft deletion, and a sync tick.
- [ ] Deleting a network that has member facilities is refused. Deletion would otherwise leave those facilities pointing at a deleted network, and either they stay sensitive with nothing to name them or they turn ordinary and begin syncing confidential data everywhere.
- [ ] A network with no members can be deleted, such as one defined ahead of the facilities that will be created into it.
- [ ] A deleted facility still counts as a member, because restoring it would otherwise leave it pointing at a network that no longer exists.

## Facility membership

- [ ] A facility belongs to at most one sensitive network, held as a nullable reference from the facility to the network.
- [ ] A facility is sensitive exactly when it belongs to a network. There is no separate sensitivity flag, so every reader of facility sensitivity tests network membership instead.
- [ ] Placing a facility in a network is therefore the only way to make it sensitive.

## Changing membership

Confidential data that has already synced to a facility cannot be recalled, so a facility only ever changes network when it carries nothing it is not entitled to take with it.

- [ ] A facility's network is chosen when the facility is created.
- [ ] A facility belonging to no network cannot be placed in one. Making a facility sensitive means creating a new facility already enrolled in the network.
- [ ] A facility cannot be removed from its network. Un-networking a facility means wiping its local data and resyncing it from scratch.
- [ ] A facility that is the sole member of its network can be moved to another network, since it holds no sibling's data to take with it.
- [ ] A facility that shares its network with other facilities cannot be moved to another network.

### When a facility moves network

- [ ] The facility's own records are rescoped to the network it moves to, so the facilities already in that network receive them.
- [ ] The facility receives the confidential data its new network recorded before it moved, not only what is recorded afterwards.
- [ ] The network the facility left is empty, and can be deleted.

## Facility access for users

Network membership scopes which data reaches a facility. It does not widen which facilities a user may log in to, which stays a per-facility relationship.

- [ ] A user linked to one member of a network gains no access to that network's other members.
- [ ] A user who may access all non-sensitive facilities reaches every facility belonging to no network, combined with the facilities they are explicitly linked to.
- [ ] When no facility belongs to any network, a user who may access all non-sensitive facilities reaches every facility, without the system enumerating them.
- [ ] A user restricted to their explicitly linked facilities reaches exactly those, whether or not they belong to a network.
- [ ] Facility servers and mobile devices resolve facility access the same way.

## Scoping sync by network

- [ ] The sync lookup table carries the sensitive network a record belongs to, alongside the facility column that scopes genuinely facility-bound records such as patient facility links and facility-scoped settings.
- [ ] The network column is indexed, because every outgoing snapshot filters on it.

### What carries a network

- [ ] A record that hangs off an encounter carries the network of the facility that encounter took place at, and carries no facility. Where that facility belongs to no network, the record carries neither, and so reaches every facility.
- [ ] Notifications resolve their network the same way, through the encounter their metadata names.
- [ ] Encounter data is the only data a network scopes. A record that is genuinely facility-bound — an appointment, an appointment schedule, a location assignment, a patient facility link, a facility-scoped setting — keeps its facility and carries no network, so it reaches that facility alone whether or not the facility belongs to a network.

### Admitting a record to a facility

- [ ] A sync session names the facilities it is pulling for, and resolves the networks those facilities belong to. A facility belonging to no network contributes no network.
- [ ] An outgoing snapshot admits a record when it carries neither a facility nor a network, when its facility is one the session names, or when its network is one the session's facilities belong to.
- [ ] A session whose facilities belong to no network resolves an empty set of networks, so only the first two conditions can admit a record.
- [ ] A session covering several facilities admits every record scoped to any of them, and every record scoped to any network they belong to.
- [ ] A facility configured to sync all lab requests receives every lab request, ahead of patient and network scoping.

## Facilities that were sensitive before networks existed

Facilities previously marked sensitive were isolated from each other as well as from the rest of the deployment: each pulled its own confidential data and no other facility's. Networks preserve that.

- [ ] Each facility that was sensitive before networks existed belongs to its own network of one, so it continues to receive exactly the data it received before.
- [ ] Each of those networks takes the code and name of its facility, which an administrator can change through the reference data import.
- [ ] Their lookup rows carry that network in place of the facility, so a facility that later moves into one of those networks receives the confidential data recorded before it moved.
- [ ] Only the lookup rows scoped to a facility that belongs to a network are rescoped. A deployment with no networked facility rescopes nothing.
- [ ] Rows scoped to a facility deleted while it was sensitive keep their facility, because that facility has no network to move them to. They reach no facility, as they did before.
- [ ] Rescoping leaves each row's sync tick alone, so no facility re-pulls a record it already holds.
- [ ] A facility that was deleted while sensitive gains no network, since it receives nothing.
- [ ] A deployment with no sensitive facilities gains no networks.

## Mobile

- [ ] Mobile devices hold the network records and each facility's membership, pulled as reference data.
- [ ] Membership is the only facility sensitivity mobile records, and it feeds the same facility access rules as elsewhere.
