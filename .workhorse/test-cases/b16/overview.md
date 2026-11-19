# Facility websocket connections

Scenarios for the facility server's socket connections: who may connect, who receives each event, and what an event carries.

## Connecting

- [x] A connection with no token is refused (verifies spec: FWS)
- [x] A connection with a token that is not valid is refused (verifies spec: FWS)
- [x] A connection with an expired token is refused (verifies spec: FWS)
- [x] A connection with a token for a user who is no longer active is refused (verifies spec: FWS)
- [x] A connection with a valid facility server token is accepted (verifies spec: FWS)
- [ ] Signed in to the web app on a facility server, the dashboard's task list, today's appointments and bookings, and the notifications bell still update live without a page reload (verifies spec: FWS)
- [ ] Left signed in past the token's lifetime with activity, the web app keeps receiving live updates after the connection is ended and re-established (verifies spec: FWS)

## Who receives an event

- [x] A change to a designated task reaches the designated user and not another user at the same facility (verifies spec: FWS)
- [x] A change to an undesignated task reaches connections at the task's facility and not a connection without that facility (verifies spec: FWS)
- [x] A change to an appointment with a location group and no location reaches its clinician and not another user (verifies spec: FWS)
- [x] A change to a notification reaches the user it is for and not another user (verifies spec: FWS)
- [x] A settings change reaches every connection (verifies spec: FWS)
- [x] A change to an appointment with no location group reaches its clinician as a bookings change (verifies spec: FWS)

## What an event carries

- [x] Task, appointment, notification and settings events carry no record (verifies spec: FWS)
- [x] A task or appointment change is not also sent as a table change event (verifies spec: FWS)
- [ ] Adding a reminder contact over Telegram still marks it as connected in the reminder contact window once the contact registers (verifies spec: FWS)
