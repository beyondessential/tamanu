# Lab result widget removal: test cases

## Lookup address

- [x] A request to the widget's former address on the central server, made without signing in, is refused and returns no lab request data, under both `/api` and `/v1`
- [x] The central server's other public routes still answer, and still carry the cross-origin header when an allowed origin is set

## Settings

- [x] The central settings no longer include the lab result widget whitelists
- [x] Upgrading makes no change to the database, so a deployment's stored lab result widget whitelists stay as they were for an earlier release to read
- [x] A deployment with the whitelists still in its local config has them ignored, and nothing is carried into settings on upgrade
- [ ] The admin panel's settings editor no longer lists Lab result widget under the central settings
