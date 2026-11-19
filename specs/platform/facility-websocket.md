---
id: FWS
---

# Facility websocket connections

Applies to the socket connections the web app opens to the facility server that serves it, and to the events the facility server sends over them.

## Connecting

- A connection is accepted when its handshake carries a valid access token issued by the facility server, the same token the web app uses for the facility server's HTTP API.
- A connection with no token, an invalid token, an expired token, or a token for a user who is no longer active is refused.
- The facility server ends a connection when the token it was accepted with expires. The web app reconnects with a current token.

> [!NOTE]
> These are the same rules the [central server applies](central-websocket.md#connecting) to its own connections, against the facility server's tokens.

## Who receives an event

- A connection belongs to the user its token was issued for and, when the token names a facility, to that facility.
- A change to a task designated to one or more users is sent to those users' connections.
- A change to an undesignated task is sent to the connections at the facility of its encounter's location. When that facility cannot be found, it is sent to every connection.
- A change to an appointment with a location group and no location is sent to its clinician's connections as an appointments change.
- A change to an appointment with no location group is sent to its clinician's connections as a bookings change.
- A change to a notification is sent to the connections of the user it is for.
- A settings change and a refreshed materialised view are sent to every connection.
- The outcome of a reminder contact registering with or leaving the messaging service is sent to every connection, with the contact's id.

## What an event carries

- A change event names what changed and carries none of the changed record: no task, appointment, notification or setting, and no changed columns.
- Table change events are sent for settings and notifications only.

> [!NOTE]
> The web app refetches what it shows when it is told of a change, so an event needs to say no more than which change it is.
