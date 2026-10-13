# SOP: Restore a server's backup as a copy

Use this to stand up or refresh a clone or test environment from another
server's backup. A restored database holds the source server's sync host, sync
credentials, device identity and integration credentials (email, Telegram,
DHIS2, mSupply), so a copy that skips these steps can sync, report and send
messages as the server it came from. This is **mutating**, so **dev-OTS** by
default. Run it on the copy only: on a live server it removes that server's sync
setup and integration credentials.

## Clone environments managed by ansible

Clone hosts (canopy's `clone` rank) refresh with an ordinary Canopy restore of
the source's database. The restore stops Tamanu, runs
`forget_server_identity()`, and starts Tamanu again. The clone keeps its own key
and never receives the source's. On v2.60 and later, each clone facility is then
set up against the clone's central automatically.

After the restore, enter test credentials for any integration you need to test
on the clone. A clone below v2.60 also needs each facility's sync set up against
the clone's central by hand.

## Any other copy

This covers a VM or disk clone, a Windows clone, and a database dump restored by
hand.

1. Do not start Tamanu yet.
2. Make sure each facility declares the copy's central (`sync.host` in its
   config, or `SYNC_URL` in its environment), and that the environment carries
   none of the source's sync credentials. A facility whose database records a
   different central then refuses to start. A copied config file can also hold
   integration credentials (such as `mailgun` or `integrations`) and the
   source's settings key (`crypto.settingsPsk`): remove them, and give the copy
   its own `auth.secret` and `auth.refreshToken.secret` so the two servers'
   logins are not interchangeable.
3. Run this against every restored database (central and each facility), as
   described in `connect-psql.md`:

   ```sql
   BEGIN;
   SELECT set_config('tamanu.this_is_a_copy', 'true', true);
   SELECT forget_server_identity();
   COMMIT;
   ```

   The function refuses to run without the `set_config` line in the same
   transaction. Never set it on the server the copy was taken from.

   It removes every value encrypted with the source's key, the identity facts,
   and every secret setting. A database from a version without the function
   takes the equivalent script in the ops repo,
   `ansible/roles/postgres/files/forget-server-identity.sql`.

4. For a VM or disk clone, give the copy its own key: move the old key file
   aside and run the server's `configSecret init` (for a containerised server,
   replace the mounted key secret instead).
5. Run the central's `upgrade` subcommand once. The function removes the
   settings key and `upgrade` creates a new one; without it, saving any secret
   setting fails.
6. Start Tamanu, then set each facility up against the copy's central with the
   setup wizard or `setupSync`. Central issues each facility new sync
   credentials.
7. Enter test credentials for any integration you need to test on the copy.
