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

See `../sops/connect-psql.md` for in-session helpers.

## Config

```
bestool tamanu config -p facility-server   # dump merged config for a process
```

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
bestool restart fhir           # restart FHIR workers
bestool caddy upgrade          # upgrade Caddy (Windows; causes brief downtime)
```

## Other

```
bestool crypto hash path/to/folder   # checksum a folder (corruption checks)
```

For the full historical query cookbook (sync-health SQL, FHIR queue SQL, etc.),
see the legacy `llm/docs/on-call-cheatsheet.md` while migration is in progress.
