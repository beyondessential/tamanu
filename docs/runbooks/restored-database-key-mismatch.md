# Runbook: restored database, secrets will not decrypt

A deployment restored from another deployment's database (a clone refreshed from
prod, or a host rebuilt from backup) cannot read its own secrets. The visible
symptom is usually a facility that will not sync and a sync user locked out on
central, not anything mentioning encryption.

Every action is tagged with its class from the ladder in `../README.md`. The
remedy moves key material between hosts, so it carries the **sensitive-data**
flag as well: read `../ruled-out-actions.md` before running anything here.

## 1. When this applies

From 2.60, `local_system_secrets` holds the facility's sync password, the device
key, the reporting-role secret, and the deployment-wide settings PSK. Every row
is encrypted at rest with a **per-server key**, and the PSK in turn decrypts
every secret setting (integration credentials and similar).

That key is generated once per host and never leaves it:

- **Linux**: a podman secret, `tamanu-config-key`, mounted into the containers at
  `/run/secrets/tamanu-config-key`.
- **Windows**: a file at the path in the server's `crypto.keyFile` config,
  created by `configSecret init`.

**No backup contains it.** So a database restored onto any other host arrives
encrypted under a key that host does not have. Use this runbook when a restore
has happened and any of the following follow it:

- The facility will not sync, and central reports the sync user as locked out
  after a run of invalid-credential attempts.
- An upgrade stops with "does not decrypt this database's secrets" (versions
  carrying the config-key check).
- An integration that worked on the source deployment fails to authenticate,
  or the admin panel will not show or save a secret setting.

Confirm a restore actually happened (Canopy notes, the deployment's change
record, whoever ran it) before acting. The lockout on its own has other causes.

## 2. Establish context

Which deployment, which servers, and when the restore ran: see
`../deployment-context.md`. Establish **which deployment the database came
from**, because that names the host holding the only usable key. **[diagnose]**

## 3. Confirm the mismatch

On the restored server, confirm the database holds encrypted values and that this
host's key does not read them. **[diagnose]**

- Check the rows exist: `SELECT count(*) FROM local_system_secrets;` (see
  `../sops/connect-psql.md`). Values starting `S1:` are encrypted.
- Read the server log at startup for
  `initServerConfig: could not read sync password secret`. On versions before the
  fix this is the only trace, and it is followed by the server falling back to the
  config password, which is what drives the lockout.
- On a version carrying the check, run the upgrade: it stops and names the key
  file path rather than proceeding.

A key file that is simply **absent** is a different fault with the same
signature. The upgrade names which of the two it is.

## 4. Resolve

Until the backup carries the key, there are two ways out, and the choice is about
which deployment the restored database is allowed to be.

### 4a. Give the restored host the source's key

The only option that keeps the restored data fully usable, integrations
included. **[dev-OTS, sensitive-data]**

Take the key from the source deployment's host and install it on the restored
host, then restart the servers (`../sops/restart-services.md`):

- **Linux**: read the podman secret on the source, create the same-named secret
  on the target. The value never goes into chat, a ticket, a commit, or a
  screenshot.
- **Windows**: copy the file named by `crypto.keyFile`, matching the path on the
  target's config. `configSecret init` will not overwrite an existing file, so
  clear or move the target's own key first.

Understand what this means before doing it: the restored host can now decrypt
every secret the source deployment holds, including live integration
credentials. That is acceptable for a clone that already carries a copy of the
source's clinical data, and it is the intended path for a host rebuilt from
backup. It is not acceptable for a lower-trust environment that should not hold
production credentials.

### 4b. Let the restored host provision its own secrets

For a clone that should not carry production credentials, or when the source key
is genuinely gone. **[dev-OTS]**, and **only ever against the restored host**.

Clear the unreadable rows from `local_system_secrets` on the restored central and
facility servers, so the next upgrade mints a fresh device key and settings PSK,
then reissue the facility's sync credentials against the restored central. Secret
settings stay unreadable and have to be re-entered by hand.

This deletes secrets, so it is a developer action with an over-the-shoulder, and
the target must be confirmed as the restored host first. Running it against the
source deployment destroys the only copy of that deployment's secrets. If the
source key is lost and the source is production, that is an escalation, not a
step to run.

## 5. Do not

- **Do not reset the sync user's password to clear the lockout.** The lockout is
  a symptom; the facility is sending a stale credential because it cannot read
  the stored one. Changing the password on central does not make the stored one
  readable, and it puts the deployment further out of step.
- **Do not regenerate the key on the restored host** and expect the data back.
  Once the rows are encrypted under a key nobody holds, the values are gone.
- **Do not run 4b against production.**

## 6. Escalate

Escalate when the source deployment's key cannot be obtained and the restored
host is production, when the restore's source is unclear, or when secret settings
have to be re-entered and nobody holds the credentials. Hand over the deployment,
the source of the restore, the upgrade output or the log line from §3, and which
of 4a or 4b was attempted. Use the structured payload from
`senaite-integration-delay.md` §6.
