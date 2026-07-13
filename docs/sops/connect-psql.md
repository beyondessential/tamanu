# SOP: Connect to psql

Open a PostgreSQL shell against a Tamanu database. All connection steps here are
**[diagnose]** — connecting read-only inspects nothing destructive. Read/write
mode and running mutating SQL take their class from the specific statement.

## bestool (Windows and Linux)

The standard way, on both platforms, is bestool. It pulls credentials from the
Tamanu config, so it does not prompt for a password:

```
bestool tamanu psql
```

Read/write mode (needed before any mutating statement — treat the mutation
itself per its own class):

```
bestool tamanu psql -W
```

Connect as another role (for example `postgres`):

```
bestool tamanu psql -U postgres
```

Inside the session, useful toggles and helpers:

- `\W` — toggle read-write mode
- `\R` — toggle redactions (redactions hide PII by default; untoggling is
  **sensitive-data**)
- `\snip list`, `\snip run <name>` — run saved snippets
- `\?` — full help

## Kubernetes / Headlamp deployments

On Kubernetes-hosted deployments there is no host to bestool into. Get a shell on
the database via the cluster:

- Use Headlamp (or `kubectl`) to open a shell on the CloudNativePG primary pod,
  then run `psql` inside it, or
- `kubectl exec -it <cnpg-primary-pod> -- psql -U postgres <database>`

Identify the primary pod first (do not assume an ordinal). Cluster-mutating
`kubectl` actions are ruled out — see `../ruled-out-actions.md`.

## Notes

- Prefer bestool where a host exists; it avoids handling raw credentials.
- Databases are typically `tamanu_sync` (central sync) and the facility DB;
  confirm which you are on before running facility-vs-central queries.
- For deep host/database procedures (restores, dumps), see
  `beyondessential/ops`. Do not improvise them from a psql shell.
