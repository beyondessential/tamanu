# Server security docs

As part of the deployment process, LAN and Sync servers are required to have apache or nginx set up on the same machine, so everything is run over https. This acts as an encryption layer before any data is sent over the network.

Tamanu internally handles permissions separately per user role on every request to the sync and lan server.