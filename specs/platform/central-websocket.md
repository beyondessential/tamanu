---
id: CWS
---

# Central websocket connections

Applies to the socket connections that the mobile app, the web app and the facility server open to the central server, and to the events the central server accepts and sends over them.

## Connecting

- A connection is accepted when its handshake carries a valid access token, the same token the client uses for the central server's HTTP API.
- A connection with no token, an invalid token, an expired token, or a token for a user who is no longer active is refused.
- The central server ends a connection when the token it was accepted with expires. The client reconnects with a current token.
- A connection that is recovered after a brief disconnection presents a valid token again.
- The mobile app and the web app send the token of the signed-in user. The facility server sends the token of its sync account.

## Patient contact insert

- A patient contact insert stores a contact with an id, a patient, a relationship, a name and a communication channel, and no other fields.
- Connection details are set when the contact registers with the messaging service and are not accepted from the connection that adds the contact.
- The contact is stored when the connected user may write to the patient. Otherwise the insert is refused.
- An insert with a communication channel the central server does not offer, or with a missing id, patient or name, is refused.

## Change notifications

- When a setting changes, the central server tells every connection that settings have changed, without saying which.
- The central server sends no other table change notifications.

## Replies

- The Telegram bot information reply goes to the connection that asked for it.
