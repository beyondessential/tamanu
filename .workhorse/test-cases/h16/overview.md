# Lab result widget removal: test cases

## Lookup address

- [x] A request to the widget's former address on the central server, made without signing in, is refused and returns no lab request data, under both `/api` and `/v1`
- [x] The central server's other public routes still answer, and still carry the cross-origin header when an allowed origin is set

## Settings

- [x] The central settings no longer include the lab result widget whitelists
- [x] Upgrading deletes a deployment's stored lab result widget whitelists and leaves its other settings in place
- [x] A deployment with the whitelists still in its local config has them ignored, and nothing is carried into settings on upgrade
- [ ] The admin panel's central settings no longer list Lab result widget
