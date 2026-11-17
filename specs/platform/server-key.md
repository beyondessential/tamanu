---
id: SKEY
---

# Server key

Applies to the key file each server encrypts its local secrets with, and to the encrypted values in its configuration files.

## Where the key comes from

- Each server reads its key from the file its configuration names, which a deployment sets through the `CRYPTO_KEY_FILE` environment variable.
- A running server encrypts its local secrets, such as its device key, its sync password and its copy of the [settings PSK](../administration/settings/secret-encryption.md), with that key and no other.
- Outside production, a server whose configuration names the default key path and finds no file there generates a key at that path, so each development checkout has a key of its own.
- A production server never generates its key. When the key file is missing, the server does not start.
- An upgrade stops when a configuration file holds an encrypted value the configured key does not decrypt, and names each such value so it can be re-encrypted with that key, noting when any are under the [published development key](#the-published-development-key).

## The published development key

- The published development key is a development key in the repository's history. A production server refuses it as its key wherever it is mounted, and does not start.
- An upgrade finds the local secrets that only the published development key decrypts and re-encrypts them under the configured key, in one transaction.
- When the configured key file is missing and the stored secrets are under the published development key, the upgrade stops and says how to provide a key for the server.

> [!NOTE]
> Re-encrypting during the upgrade lets a server that ran on the development key move to a key of its own by mounting one, without giving up the device key and sync credentials it already holds.
