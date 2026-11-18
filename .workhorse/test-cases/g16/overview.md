# Mobile sign-in permissions

Each user's permissions on a device come from their own online sign-in, offline included.

## Offline sign-in

- [x] Permissions stored at online sign-in are kept per user, and each user reads back only their own (verifies spec: MSIGN)
- [x] A user who has never signed in online on the device is refused offline, with the "sign in while connected first" message (verifies spec: MSIGN)
- [ ] Two users on one device: user A (broad role) signs in online, signs out; user B (restricted role, e.g. no lab results or medications) signs in online, signs out; with the network off, B signs in and sees only what B's role allows, and A signs in and sees what A's role allows (verifies spec: MSIGN)
- [ ] With the network off, a user whose role was narrowed on central since their last online sign-in still holds the permissions from that sign-in, and holds the narrowed set after their next online sign-in (verifies spec: MSIGN)
- [ ] An administrator signs in offline after an earlier online sign-in and has full access (verifies spec: MSIGN)

## Reopening the app

- [ ] Reopening the app with a session open restores the signed-in user's own permissions, not those of whoever signed in online last (verifies spec: MSIGN)
- [ ] After upgrading from a version that stored one permission list per device, a user who was signed in is returned to the sign-in screen on reopening, signs in online, and continues normally (verifies spec: MSIGN)
- [ ] After that upgrade, a user who signed in online before it, but not since, is told to sign in while connected before they can sign in offline (verifies spec: MSIGN)
