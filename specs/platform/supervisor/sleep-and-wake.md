---
id: SLPWK
---

# Sleep and wake

Applies to a server whose platform provides an actuator sleeping when nobody has used it for a while and waking when someone does, each server having its own supervisor and sleeping and waking on its own, so the servers of one deployment can be in different states.

## Activity

- Activity is every request through the supervisor's Caddy, except:
  - health probes, monitoring checks, and probes of the supervisor itself
  - the [changes-pending check](../../sync/changes-pending-check.md)
  - time synchronisation requests
  - on central, logins and token refreshes, which central's supervisor [serves itself while central is asleep](serving-while-asleep.md)
- A request counts as activity from when it starts until it finishes, so a long-running import or report holds the server awake while it runs.
- Websocket upgrade requests are not activity, and frames on an open socket are invisible to the supervisor.
- A server goes to sleep after its idle time passes with no activity. The idle time is supervisor configuration, and defaults to 30 minutes.
- A server with steady use never goes quiet, and so never sleeps.

## Going to sleep

- A server's parts are its database, api, web, sync, tasks and fhir, and asleep means every one of them is stopped.
- When the idle time is reached, the supervisor first stops forwarding requests that count as activity, and handles them itself, so nothing new reaches the database.
- It then asks the api whether the server is busy: a scheduled task is running, or a work queue (report requests, FHIR jobs, communications, integration pushes) has pending items. A busy server goes back to forwarding requests and stays awake, and the supervisor tries again after the next idle time.
- It then asks the actuator to stop tasks, fhir and sync, and waits until they have stopped. A task that is running when tasks is stopped finishes first.
- On central, it then asks the api for a final [sync lookup refresh](../../sync/lookup-table.md#refreshing-on-demand), which returns the highest real-change sync tick, and for the next time a time-driven scheduled task is due. The supervisor holds both for the sleep.
- On a facility server, it reads, from the facility database, the facility's pull cursor, whether the facility holds changes it has not yet pushed to central, the next time a time-driven scheduled task is due, and the central address, device id and sync credentials the facility syncs with. The supervisor holds them for the sleep.
- It then asks the actuator to stop the api and web, and waits until they have stopped.
- On central, it then [copies login's tables](serving-while-asleep.md#the-copy) into its own PostgreSQL.
- Only then does it ask the actuator to stop the database.
- A request that counts as activity, arriving while the server is going to sleep, cancels the sleep. The supervisor wakes the server again from whatever point the sleep had reached.
- A step that fails, such as a lookup refresh that aborts, cancels the sleep in the same way. The supervisor reports the failure and tries again after the next idle time.
- The supervisor only puts a server to sleep when the server's database is migrated to the supervisor's own release.

## Waking

- A request that counts as activity, arriving at a server that is asleep, starts a wake.
- While the server wakes, a request to an API path is answered at once with `503 Service Unavailable` and a `Retry-After` header.
- While the server wakes, a browser request gets a waking page, which reloads itself once the server is up.
- While the server is asleep or waking, a websocket upgrade request gets `503 Service Unavailable` and does not start a wake. Clients reconnect by themselves once the server is up.
- To wake, the supervisor first asks the actuator to start the database, and waits until it is ready.
- On central, it then [hands back](serving-while-asleep.md#handing-back) what was written to the copy, and deletes the copy.
- Only then does it ask the actuator to start the other parts, so the database has a single writer until the hand-back is done.
- The supervisor starts forwarding requests to each part once that part is ready.
- A wake that the supervisor started is finished even if the request that started it has gone.
- A wake that stalls, such as a part that never becomes ready, is retried. Requests keep getting the waking response meanwhile, and the supervisor reports the failure.

## Partial wakes

- A partial wake starts only the parts some piece of work needs, such as database and sync for a facility to pull.
- A sleeping facility server's supervisor acts on the facility's normal sync schedule. When the facility held unpushed changes at sleep, it starts a partial wake. Otherwise it makes the changes-pending check against central with the values it held at sleep, and starts a partial wake when the answer is that there are changes to pull.
- A facility's partial wake starts database and sync. Sync runs once, and the partial wake ends when that sync has finished.
- Any server's supervisor wakes database and tasks when a time-driven scheduled task is due, and on central also the api. The partial wake ends once the due tasks have run and the work queues they fed are empty.
- A partial wake follows the same order as a full wake: database first, then on central the hand-back, then the parts the work needs.
- A partial wake that is making no progress within a bounded time is ended. A sync that is still pulling or pushing is making progress.
- Ending a partial wake runs the going-to-sleep sequence again, so the values the supervisor holds are read afresh.
- During a partial wake the supervisor keeps handling requests that count as activity itself. One arriving turns the partial wake into a full wake.

## Serving checks and logins between states

- On central, while the api is up, the supervisor forwards changes-pending checks, logins and token refreshes to it, including during a partial wake.
- On central, from when the final lookup refresh returns until the api is up again, the supervisor answers changes-pending checks from the tick it holds.
- On central, logins and token refreshes get the waking response from when the api stops until the copy is ready, and from when the hand-back starts until the api is up.

## Scheduled tasks

- Each scheduled task is either time-driven, meaning its work arises from the passage of time (scheduled reports, vaccination reminders, generating repeating appointments and tasks, generating medication administration records, automatic discharges, bed fees), or activity-driven, meaning its work arises only from what users and integrations do (queue processors, cleaners).
- While a server sleeps, its supervisor wakes it for the next time a time-driven task is due. Activity-driven tasks never wake a server.
- When the tasks part starts after any wake, each task whose scheduled run fell while the server was asleep runs once, whatever number of runs it missed.
- Each task records when it last ran, which is how missed runs are found after a wake.

## Rollouts

- A rollout replaces the supervisor along with the rest of the server, so a rollout to a [sleeping server wakes it](overview.md#resilience).
- A new supervisor that finds a copy made by the previous release hands it back before anything else, using the columns that the copy and the database have in common.
- A rollout's migrations wait until the supervisor [reports that the database is clear for other writers](overview.md#status).
- After a rollout, the server sleeps again when it has been idle for the usual time.

## Actuator contract

- The supervisor and the actuator talk over a versioned HTTP contract, described by an OpenAPI file in the Tamanu repository. The platform implements it.
- The supervisor sets the desired state of each part (up or down) rather than sending commands, so a repeated request cannot leave the server half started.
- Setting a desired state returns at once. The actuator applies it in the background, and the supervisor polls the actuator's status until each part is ready or stopped.
- The parts are `database`, `api`, `web`, `sync`, `tasks` and `fhir`. A platform that runs a server without one of these parts reports it as ready whenever it is asked to be up.
- Each version of the contract stays supported by the actuator for as long as a deployed Tamanu release uses it.
- Requests always reach the server through its supervisor, whatever state the actuator puts the parts in.

## Client requests that wake central

- Before the facility server or the mobile app sends a patient contact insert over the socket, it makes an HTTP request to central, which wakes central if it is asleep.
- Before the facility server's bot information route or the mobile app asks central for the Telegram bot information over the socket, it makes an HTTP request to central, which wakes central if it is asleep.
- The facility server's bot information route answers with an error when central does not answer in time.
- With a Telegram webhook configured, Telegram's requests to central count as activity, and they wake central when it is asleep.
- With Telegram polling instead, messages sent to the bot while central is asleep wait at Telegram and are handled when central next wakes.

> [!NOTE]
> Socket messages travel on a connection that does not wake a sleeping server, so a client sending a message that needs central to act on it has to make an ordinary request to central first.
