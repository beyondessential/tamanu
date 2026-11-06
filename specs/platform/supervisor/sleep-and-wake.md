---
id: SLPWK
---

# Sleep and wake

A server whose platform provides an actuator sleeps when nobody has used it for a while, and wakes when someone does. Each server, central and each facility server, has its own supervisor and sleeps and wakes on its own, so the servers of one deployment can be in different states. A server with steady use never goes quiet, and so never sleeps.

A server's parts are its database, api, web, sync, tasks and fhir. Asleep means every part is stopped. A partial wake starts only the parts some piece of work needs, such as database and sync for a facility to pull.

## Activity

- [ ] Activity is every request through the supervisor's Caddy, except health probes, monitoring checks, the changes-pending check (see `sync/changes-pending-check.md`), and probes of the supervisor itself.
- [ ] A request counts as activity from when it starts until it finishes, so a long-running import or report holds the server awake while it runs.
- [ ] Websocket upgrade requests are not activity, and frames on an open socket are invisible to the supervisor.
- [ ] A server goes to sleep after 30 minutes with no activity.

## Going to sleep

- [ ] When the idle time is reached, the supervisor first stops forwarding requests to the server's parts and handles them itself, so nothing new reaches the database.
- [ ] It then asks the actuator to stop tasks, fhir and sync, and waits until they have stopped.
- [ ] On central, it then asks the api for a final sync lookup refresh, which returns the highest real-change sync tick (see `sync/changes-pending-check.md#highest-real-change-tick`). The supervisor holds that value for the whole sleep.
- [ ] On a facility server, it reads the facility's own pull cursor, and whether the facility holds changes it has not yet pushed to central, and holds both for the whole sleep.
- [ ] On central, it asks the api for the next time a time-driven scheduled task is due (see [Scheduled tasks](#scheduled-tasks)).
- [ ] It then asks the actuator to stop the api and web, and waits until they have stopped.
- [ ] On central, it then copies login's tables into its own PostgreSQL (see `platform/supervisor/serving-while-asleep.md#the-copy`).
- [ ] Only then does it ask the actuator to stop the database.
- [ ] A request that arrives while the server is going to sleep cancels the sleep. The supervisor wakes the server again from whatever point the sleep had reached.
- [ ] The supervisor only puts a server to sleep when the server's database is migrated to the supervisor's own release.

## Waking

- [ ] A request that counts as activity, arriving at a server that is asleep, starts a wake.
- [ ] While the server wakes, a request to an API path gets `503 Service Unavailable` with a `Retry-After` header. The request is not held open, since a wake can take minutes.
- [ ] While the server wakes, a browser request gets a waking page, which reloads itself once the server is up.
- [ ] While the server is asleep or waking, a websocket upgrade request gets `503 Service Unavailable` and does not start a wake. Clients reconnect by themselves once the server is up.
- [ ] To wake, the supervisor first asks the actuator to start the database, and waits until it is ready.
- [ ] On central, it then hands back what was written to the copy, and deletes the copy (see `platform/supervisor/serving-while-asleep.md#handing-back`).
- [ ] Only then does it ask the actuator to start the other parts, so the database has a single writer until the hand-back is done.
- [ ] The supervisor starts forwarding requests to each part once that part is ready.
- [ ] A wake that the supervisor started is finished even if the request that started it has gone.

## Partial wakes

- [ ] A sleeping facility server's supervisor checks central's changes-pending flag on the facility's normal sync schedule, as the facility's sync would, using the pull cursor and unpushed-changes state it read at sleep.
- [ ] When the flag says the facility has something to pull or to push, the supervisor asks the actuator for database and sync only. Sync runs once, and the supervisor puts the server back to sleep when that sync has finished.
- [ ] On central, the supervisor wakes database and tasks when a time-driven scheduled task is due, and puts central back to sleep once the due tasks have run (see [Scheduled tasks](#scheduled-tasks)).
- [ ] A partial wake that has not finished within a bounded time is ended, and the server is put back to sleep.
- [ ] A request that counts as activity, arriving during a partial wake, turns it into a full wake.
- [ ] A partial wake follows the same order as a full wake: database first, then on central the hand-back, then the parts the work needs.

## Scheduled tasks

- [ ] Each scheduled task is either time-driven, meaning its work arises from the passage of time (scheduled reports, vaccination reminders, generating repeating appointments and tasks, generating medication administration records, automatic discharges), or activity-driven, meaning its work arises only from what users and integrations do (queue processors, cleaners).
- [ ] While central sleeps, the supervisor wakes it for the next time a time-driven task is due. Activity-driven tasks never wake a server.
- [ ] When the tasks part starts after any wake, each task whose scheduled run fell while the server was asleep runs once. A task that missed several runs does not run once per missed run.
- [ ] Each task records when it last ran, which is how missed runs are found after a wake.

## Rollouts

- [ ] A rollout of a new release wakes the server, so that migrations and deployment hooks have a database.
- [ ] A rollout replaces the supervisor along with the rest of the server. A new supervisor that finds a copy made by the previous release hands it back before anything else, using the columns that the copy and the database have in common.
- [ ] A rollout's migrations wait until the supervisor reports that the database is clear for other writers (see `platform/supervisor/overview.md#status`).
- [ ] After a rollout, the server sleeps again when it has been idle for the usual time.

## Actuator contract

- [ ] The supervisor and the actuator talk over a versioned HTTP contract, described by an OpenAPI file in the Tamanu repository. The platform implements it.
- [ ] The supervisor sets the desired state of each part (up or down) rather than sending commands, so a repeated request cannot leave the server half started.
- [ ] Setting a desired state returns at once. The actuator applies it in the background, and the supervisor polls the actuator's status until each part is ready or stopped.
- [ ] The parts are `database`, `api`, `web`, `sync`, `tasks` and `fhir`. A platform that runs a server without one of these parts reports it as ready whenever it is asked to be up.
- [ ] Each version of the contract stays supported by the actuator for as long as a deployed Tamanu release uses it.
- [ ] The actuator never changes routing. Requests always reach the server through its supervisor.

## Client requests that wake central

Socket messages travel on a connection that does not wake a sleeping server, so a client sending a message that needs central to act on it makes an ordinary request to central first.

- [ ] Before the facility server or the mobile app sends a patient contact insert over the socket, it makes an HTTP request to central, which wakes central if it is asleep.
- [ ] Before the facility server's bot information route or the mobile app asks central for the Telegram bot information over the socket, it makes an HTTP request to central, which wakes central if it is asleep.
- [ ] The facility server's bot information route answers with an error, rather than waiting indefinitely, when central does not answer in time.
- [ ] With a Telegram webhook configured, Telegram's requests to central count as activity, and they wake central when it is asleep.
