---
id: MSESS
---

# Mobile app session

Applies to the signed-in session the mobile app holds on a device: what it holds, how it survives the app closing and updating, and what ends it.

## What a session holds

- A session holds the signed-in user's details, the access and refresh tokens issued by the central server, and whether a user is currently signed in to the app's screens.
- Signing in while the device is online sets the user and both tokens. Signing in while it is offline sets the user and leaves the stored tokens as they were.
- The user's details are held without their password.
- The session is kept in the device's secure storage.
- The app's screens read the signed-in user from the session, so a change of user shows everywhere at once.

> [!NOTE]
> Being signed in to the screens and holding tokens are separate facts. A device can hold tokens and keep syncing while nobody is signed in to its screens, which is the state an inactivity sign-out leaves it in.

## Opening the app

- The app reads the stored session before it shows its first screen.
- With a user signed in to the screens when the app was last closed, the app opens signed in without asking for a password, however long it was closed.
- A signed-in device with a facility linked opens on the home screen, and one with no facility linked opens on facility selection.
- With nobody signed in to the screens, the app opens on the log in screen.
- Stored tokens are handed to the central server connection when the app opens, so syncing resumes whether or not anyone is signed in to the screens.
- Updating the app to a newer release keeps the stored session, so a signed-in user is still signed in afterwards.

## Welcome introduction

- Until a device has shown its welcome introduction, signing in leads into the introduction. Once it has, signing in leads straight to the home screen.
- The introduction counts as shown once the home screen has appeared, and stays shown through signing out, a change of user, the app closing and the app updating.

## Signing out

- Logging out from the More screen, or returning to the log in screen from facility selection, signs the user out of the screens, discards both tokens, stops scheduled syncing and shows the log in screen.
- A sign-out that happens while the log in screen is already showing leaves that screen as it is.

## Inactivity

- A signed-in user who has not touched the screen or used the keyboard for 30 minutes is signed out of the screens and shown the log in screen with the message "Logged out due to inactivity".
- Inactivity is checked while the app is in the foreground and again each time it returns from the background.
- An inactivity sign-out keeps the tokens, so the device carries on syncing.

> [!NOTE]
> Devices are shared and left unattended, so the screens lock on their own. Syncing carries on because the data a device has collected should reach the central server whether or not someone is looking at it.

## Rejected sessions

- When the central server rejects the device's session, or reports that the app is too old to connect, the user is signed out as if they had logged out.
- A user whose sync has stopped can reconnect by entering their password, which signs them in again online, replaces the tokens and starts a sync, without leaving the screen they are on.
- The first rejection that follows a reconnect attempt leaves the user signed in, so a wrong password shows an error in the reconnect form instead of signing them out.
