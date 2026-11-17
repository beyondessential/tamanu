---
id: SLPWK
---

# Sleep and wake

Applies to a server whose platform provides an actuator sleeping when its own users have gone quiet and waking when someone uses it, each server having its own supervisor and sleeping and waking on its own traffic alone, so the servers of one deployment can be in different states.

## Activity

- Activity is every request through the supervisor, except:
  - health probes, monitoring checks, and probes of the supervisor itself
  - time synchronisation requests
- A request counts as activity from when it starts until it finishes, so a long-running import or report holds the server awake while it runs.
- Websocket upgrade requests are not activity, and frames on an open socket are invisible to the supervisor.
- A server goes to sleep after its idle time passes with no activity. The idle time is supervisor configuration, and defaults to 30 minutes on a facility server and 15 minutes on central.
- A server with steady use never goes quiet, and so never sleeps.
- Sync requests to central are activity there. An awake facility server syncs with central every minute, so central goes quiet only once every facility server is asleep.

> [!NOTE]
> A facility's syncs are requests it makes to central, which never pass through its own supervisor, so they keep central awake and not the facility. Central needs to know nothing about facilities to sleep after them.

## Going to sleep

- A server's parts are its database, api, web, sync, tasks and fhir, and on central the patient portal. Asleep means every one of them is stopped.
- When the idle time is reached, the supervisor first stops forwarding requests that count as activity, and handles them itself, so nothing new reaches the server.
- It then asks the api whether the server is busy: a scheduled task is running, or a FHIR job is queued or in progress. A busy server goes back to forwarding requests and stays awake, and the supervisor asks again every minute while there is still no activity.
- From the moment the api answers that the server is not busy, no scheduled task starts a run until the server is awake again or the sleep is cancelled.
- It then asks the actuator to stop tasks and fhir, and waits until they have stopped. Stopping them waits for no work to finish, as when a server is stopped for any other reason.
- On a facility server, it then asks the api to sync with central once more. A final sync that does not complete, such as when central cannot be reached, cancels the sleep, and the facility stays awake until its next idle time.
- It then asks the actuator to stop sync, the api, web and the patient portal, and waits until they have stopped.
- Only then does it ask the actuator to stop the database.
- A request that counts as activity, arriving while the server is going to sleep, cancels the sleep. The supervisor wakes the server again from whatever point the sleep had reached.
- A step that fails cancels the sleep in the same way. The supervisor reports the failure and tries again after the next idle time.
- The supervisor only puts a server to sleep when the server's database is migrated to the supervisor's own release.

> [!NOTE]
> The final sync is what lets a facility sleep without holding data that central and the other facilities have not had.

## Waking

- A request that counts as activity, arriving at a server that is asleep, starts a wake.
- While the server wakes, a request to an API path is answered at once with `503 Service Unavailable` and a `Retry-After` header.
- While the server wakes, a browser request gets a waking page, which reloads itself once the server is up.
- While the server is asleep or waking, a websocket upgrade request gets `503 Service Unavailable` and does not start a wake. Clients reconnect by themselves once the server is up.
- To wake, the supervisor first asks the actuator to start the database, and waits until it is ready. Only then does it ask the actuator to start the other parts.
- The supervisor starts forwarding requests to each part once that part is ready.
- A wake that the supervisor started is finished even if the request that started it has gone.
- A wake that stalls, such as a part that never becomes ready, is retried. Requests keep getting the waking response meanwhile, and the supervisor reports the failure.

## Facilities and a sleeping central

- A facility server's first sync after central has gone to sleep wakes central. That sync [waits in line](../../sync/waking-central.md) while central wakes, and the facility's next scheduled sync goes ahead once central is up.
- A login at a facility server that central answers with the waking response falls back to the facility's own login at once.
- Data entered at one facility server reaches the others the next time they are awake and sync, which for a facility asleep through a quiet period is when it is next used.

## Rollouts

- A rollout replaces the supervisor along with the rest of the server, so a rollout to a [sleeping server wakes it](overview.md#resilience), and the rollout's migrations find the database up.
- After a rollout, the server sleeps again when it has been idle for the usual time.

## Actuator contract

- The supervisor and the actuator talk over a versioned HTTP contract, described by an OpenAPI file in the Tamanu repository. The platform implements it.
- The supervisor sets the desired state of each part (up or down) rather than sending commands, so a repeated request cannot leave the server half started.
- Setting a desired state returns at once. The actuator applies it in the background, and the supervisor polls the actuator's status until each part is ready or stopped.
- The parts are `database`, `api`, `web`, `portal`, `sync`, `tasks` and `fhir`. A platform that runs a server without one of these parts reports it as ready whenever it is asked to be up.
- The actuator reports whether it controls the server's parts. One that does not still reports on them and on [upgrades](overview.md#upgrades), and its server never sleeps.
- The actuator reports whether an upgrade of the server is in progress.
- Each version of the contract stays supported by the actuator for as long as a deployed Tamanu release uses it.
- Requests always reach the server through its supervisor, whatever state the actuator puts the parts in.

## Telegram

- With a Telegram webhook configured, Telegram's requests to central count as activity, and they wake central when it is asleep.
- With Telegram polling instead, messages sent to the bot while central is asleep wait at Telegram and are handled when central next wakes.
