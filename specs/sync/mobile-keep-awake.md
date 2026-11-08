---
id: SYNAWK
---

# Mobile keep-awake during sync

While a mobile device is syncing with the central server, its screen is kept on so that the device does not go to sleep part way through. The hold belongs to the sync itself, so it applies to every sync whichever screen the user is looking at.

## When the screen is held awake

- [ ] The screen is held awake from the moment a sync has a session with the central server until that sync ends.
- [ ] Every sync holds the screen awake, whatever started it: the periodic schedule, signing in, reconnecting with a password, selecting the device's facility (which runs the initial sync), or the user choosing a manual sync.
- [ ] The hold does not depend on which screen is showing. A sync that starts while the user is anywhere in the app holds the screen awake, as does one that starts before the user has opened the sync screen.
- [ ] A sync that the central server queues instead of granting a session holds nothing while it waits. It holds the screen awake from when it is later granted a session.

## When the hold is released

- [ ] The hold is released when the sync ends, whether it succeeds or fails.
- [ ] A sync that fails part way releases the hold, so an error never leaves the screen held on.
- [ ] Once released, the device follows its normal screen timeout.
