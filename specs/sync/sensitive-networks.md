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
- [ ] A network that has never taken a member can be deleted.

## Facility membership

- [ ] A facility belongs to at most one sensitive network, held as a nullable reference from the facility to the network.
- [ ] A facility is sensitive exactly when it belongs to a network. There is no separate sensitivity flag, so every reader of facility sensitivity tests network membership instead.
- [ ] Placing a facility in a network is therefore the only way to make it sensitive.

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

## Facilities that were sensitive before networks existed

Facilities previously marked sensitive were isolated from each other as well as from the rest of the deployment: each pulled its own confidential data and no other facility's. Networks preserve that.

- [ ] Each facility that was sensitive before networks existed belongs to its own network of one, so it continues to receive exactly the data it received before.
- [ ] Each of those networks takes the code and name of its facility, which an administrator can change through the reference data import.
- [ ] A facility that was deleted while sensitive gains no network, since it receives nothing.
- [ ] A deployment with no sensitive facilities gains no networks.

## Mobile

- [ ] Mobile devices hold the network records and each facility's membership, pulled as reference data.
- [ ] Membership is the only facility sensitivity mobile records, and it feeds the same facility access rules as elsewhere.
