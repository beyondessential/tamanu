# SOP: Restore a server's backup as a copy

Use this to stand up a clone or test environment from another server's backup.
A restored database still holds the source server's sync host, sync credentials
and device identity, so a copy that skips these steps can sync and report as the
server it came from. This is **mutating**, so **dev-OTS** by default. Run it on
the copy only: on a live server it removes that server's sync setup.

## 1. Restore without the source's key

On each host of the copy, restore with:

```
bestool canopy restore <type> <snapshot-id> --as-copy
```

`--as-copy` leaves the source's secret key behind, so the copy cannot read the
source's sync password or device key. Never use `--replacing-source` for a copy:
that brings the key with the data.

## 2. Forget the source's identity

Before starting Tamanu, run this against every restored database (central and
each facility), as described in `connect-psql.md`:

```sql
SELECT forget_server_identity();
```

It removes every value encrypted with the source's key and the facts that point
at the source's central. A database from a version without the function fails
the upgrade's key check, and that error lists what to delete instead.

## 3. Check the environment

Sync settings in the environment override the database. Make sure the copy's
environment (`.env` files, deployment manifests) does not carry the source's
sync host or credentials.

## 4. Set the facilities up against the copy's central

Start the copy's central first, then set each facility up against it with the
setup wizard or `setupSync`. Central issues each facility new sync credentials.

## 5. Re-enter secret settings

Secret settings (API keys, integration passwords) were encrypted for the source
and cannot be read on the copy. Re-enter any the copy needs in the admin panel.
