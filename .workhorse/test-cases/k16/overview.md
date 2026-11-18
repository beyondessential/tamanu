# Facility sync server listen addresses

## Address resolution (unit, `bindAddress.test.js`)

- [x] With no `SYNC_BIND_ADDRESS`, the sync server resolves to `[::1]` and `127.0.0.1` on the configured sync port (verifies spec: SYNC)
- [x] `BIND_ADDRESS` and `PORT` do not change the sync server's addresses (verifies spec: SYNC)
- [x] `SYNC_BIND_ADDRESS` replaces the defaults with its own list (verifies spec: SYNC)
- [x] A `SYNC_BIND_ADDRESS` with no valid entries is rejected at startup (verifies spec: SYNC)

## Listening (unit, `bindAddress.test.js`)

- [x] When one loopback address is taken, the sync server still starts on the other (verifies spec: SYNC)
- [x] When neither loopback address can be bound, startup fails (verifies spec: SYNC)
- [x] When an address named in `SYNC_BIND_ADDRESS` cannot be bound, startup fails (verifies spec: SYNC)

## Running servers (manual)

- [ ] `startAll` with no overrides: the sync port is listened on at `[::1]` and `127.0.0.1` only, and a manual sync from the web client completes (verifies spec: SYNC)
- [ ] `startApi` plus `startSync` as separate processes with no overrides: same as above, and the API starts a sync through the sync server (verifies spec: SYNC)
- [ ] On a host with IPv6 disabled, the sync server starts on `127.0.0.1`, logs a warning about `[::1]`, and syncs still run (verifies spec: SYNC)
- [ ] The facility server container image listens on every interface on port 4100 without extra configuration (verifies spec: SYNC)
