# SOP: Restore a server's backup as a copy

Use this to stand up or refresh a clone or test environment from another
server's backup, whether by a Canopy restore or a VM or disk clone. A restored
database still holds the source server's sync host, sync credentials and device
identity, so a copy that skips these steps can sync and report as the server it
came from. This is **mutating**, so **dev-OTS** by default. Run it on the copy
only: on a live server it removes that server's sync setup.

## 1. Restore the data and key

Restore the database together with the source's secret key, as a Canopy restore
does by default. The key lets the copy read its secret settings, as the source
does.

## 2. Make sure the copy declares its own central

Each facility of the copy must name the copy's central in its own deployment
(`sync.host` in its config, or `SYNC_URL` in its environment). A facility whose
database records a different central then refuses to start instead of syncing
to it. Also check that the copy's environment carries none of the source's sync
credentials.

## 3. Forget the source's identity

Before starting Tamanu, run this against every restored database (central and
each facility), as described in `connect-psql.md`:

```sql
SELECT forget_server_identity();
```

It removes the sync host, sync credentials, facility ids, device id, device key
and meta server id. The copy mints a new device id and key when it starts.
On a version without the function, delete those facts from `local_system_facts`
and the `syncPassword` and `deviceKey` rows from `local_system_secrets` by hand.

## 4. Set the facilities up against the copy's central

Start the copy's central first, then set each facility up against it with the
setup wizard or `setupSync`. Central issues each facility new sync credentials.

## Restoring without the source's key

A copy without the source's key (for example a database dump on a developer
machine) cannot read any of its secrets, and the upgrade refuses it. Run
`forget_server_identity()` and then `DELETE FROM local_system_secrets;`, and
re-enter any secret settings the copy needs in the admin panel.
