---
id: CWAKE
---

# Waking central before socket messages

Applies to the socket messages that the facility server and the mobile app send to central and that need central to act on them: the patient contact insert.

## Before the message

- Before the facility server or the mobile app sends a patient contact insert over the socket, it makes an HTTP request to central.
- The HTTP request is tried once, so a central that cannot be reached does not hold the caller on a long retry.
- A request that fails is logged and the message is still sent. The socket holds a message sent while it is disconnected and delivers it once it reconnects.

> [!NOTE]
> Socket messages travel on a connection that does not wake a sleeping central, while an ordinary request does, so the request goes first.
