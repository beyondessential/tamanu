---
id: SSEC
---

# Settings secret encryption

Some settings hold integration credentials — API keys, passwords, and tokens for external systems. Tamanu stores these encrypted, so that a copy of the settings data alone does not reveal them: the value held in the settings table is ciphertext, and the key that decrypts it is kept separately from the data.

That key is a single pre-shared key (the settings PSK) for the whole deployment, distinct from the per-server key that protects a server's own local secrets. Because settings are authored on the central server and synchronised out to facility servers, a secret encrypted on one server must be decryptable on the others, so every server in a deployment uses the same settings PSK.

## One key per deployment

Every server in a deployment — the central server and every facility server — uses the same settings PSK, so a settings secret encrypted on any server can be decrypted on any other. A per-server key cannot satisfy this: a facility that received a synchronised secret would be unable to decrypt one the central server had encrypted.

The central server is the source of truth for the key. When no key yet exists it generates one; a facility never generates its own. This prevents divergent keys that would leave synchronised secrets unreadable.

## Storage

Each server keeps the settings PSK in its local, non-synchronised secret store, encrypted at rest under that server's own key material — the same key that protects the server's other local secrets. A copy of the shared database therefore does not reveal the PSK, and the PSK is never written to change logs or audit logs.

The settings PSK is never itself stored as a setting: it is the key that protects secrets in the settings table, so it cannot live alongside the data it protects.

## How a facility obtains the key

A facility obtains the settings PSK from the central server over an authenticated channel, as part of establishing its sync credentials. A freshly installed facility receives it during setup; a facility that was configured before the shared key existed receives it when it next upgrades.

Until a facility has obtained the key it can still authenticate and synchronise — obtaining sync access does not require the settings PSK — but it cannot decrypt secret settings, and it keeps retrying until it obtains the key. The central server discloses the settings PSK only to an authenticated caller with full administrative rights, which includes the sync users facilities authenticate as; it is never returned to an unauthenticated caller.
