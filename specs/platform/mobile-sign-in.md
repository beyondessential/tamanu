---
id: MSIGN
---

# Mobile sign-in

Applies to signing in to the mobile app, online and offline, and to the permissions a signed-in user holds in the app.

## Online and offline sign-in

- A device with a network connection signs in through the central server. A device without one signs in offline, against the users held on the device.
- An online sign-in stores the user's password and the user's permissions on the device, for later offline sign-ins.
- Offline sign-in needs the device to be linked to a facility.
- Offline sign-in matches the email against the device's active users and checks the password against the one stored for that user. A wrong email or password is reported as invalid credentials.
- A user who has not signed in online on this device cannot sign in offline, and is told to sign in while connected first.
- Offline sign-in refuses a user whose permissions do not give access to the device's facility.

## Permissions

- A signed-in user holds the permissions they received at their own most recent online sign-in on this device. Another user's sign-in on the same device leaves them unchanged.
- An administrator holds full access whatever permissions were received.
- Reopening the app with a session still open restores that user's stored permissions. When the device holds none for them, the session ends and the app returns to the sign-in screen.
