# Reference: bestool commands

`bestool` is the standard operator CLI for Tamanu hosts (Windows and Linux). It
reads the Tamanu config, so most commands do not prompt for credentials. It
self-updates daily, spread over time, so an update can take up to 24 hours to
reach every server (longer if a server cannot auto-update).

All commands below are **[diagnose]** unless they clearly mutate (start / stop /
restart / config change), which take the class of what they do — see
`../README.md` and `../sops/restart-services.md`.

## Basics

```
bestool                 # top-level help
bestool self-update     # update bestool now
```

From 0.28.5 you can shorten any command to an unambiguous prefix, e.g.
`bestool t p` == `bestool tamanu psql`.

Detailed help for any command: append `--help`, e.g.
`bestool tamanu alerts --help`.

## Health check

```
bestool tamanu doctor
```

Runs the healthchecks locally and shows them with Canopy's effective severity
ceiling. For what each check means and how to solve it, see `../healthchecks.md`
(bridge) and Canopy's `get_check_documentation`.

## psql

```
bestool tamanu psql            # read-only shell
bestool tamanu psql -W         # read/write (mutations take their own class)
bestool tamanu psql -U postgres
```

See `../sops/connect-psql.md` for in-session helpers. bestool psql is its own
client, not standard psql — read
[its README](https://github.com/beyondessential/bestool/blob/main/crates/psql/README.md)
for the syntax that differs (read-only default, `COMMIT;` in write mode,
`${name}` interpolation, `\g`-suffix modifiers) before writing non-trivial SQL.

## Config

```
bestool tamanu config -p facility-server   # dump merged config for a process
```

## Blob store root

```
bestool tamanu blob-root                      # print the blob store root
bestool tamanu blob-root -p facility-server   # for a specific package
```

Attachment and asset bytes live in a content-addressed store on disk, not in the
database. The root is Tamanu's `blobStorage.root` setting, database-backed and
editable in the admin panel, so no config file carries it and the package is
detected from the config and database when not given.

Use it to confirm where the store actually is before looking at its contents, or
when checking a restore landed in the right place
(`../runbooks/facility-restored-from-backup.md`). For the store's own registry, see
"Blob store" in `query-cookbook.md`.

Backups of the store are scheduled and orchestrated by Canopy, not run by hand
here. Restoring one is an ops procedure with downtime planning, not a support
action (`../ruled-out-actions.md`).

## Find the current release

```
bestool tamanu find -n1                     # path to the latest Tamanu release
ls `bestool tamanu find -n1`/alerts         # e.g. list its alerts folder
```

## Service control (mutating)

```
bestool tamanu status          # what is running
bestool tamanu start           # reconcile: start missing, stop extraneous
bestool tamanu restart api     # restart a single service (api/sync/tasks/fhir)
bestool tamanu restart fhir    # restart the FHIR workers (refresh + resolve)
bestool caddy upgrade          # upgrade Caddy (Windows; causes brief downtime)
```

## Other

```
bestool crypto hash path/to/folder   # checksum a folder (corruption checks)
```

For the full query cookbook (sync-health SQL, Postgres introspection, FHIR queue
SQL, metaprogramming, etc.), see `query-cookbook.md`.
