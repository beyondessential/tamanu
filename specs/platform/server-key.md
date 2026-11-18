---
id: SKEY
---

# Server key

Applies to the key file each server encrypts its local secrets with, and to the encrypted values in its configuration files.

## Where the key comes from

- Each server reads its key from the file its configuration names, which a deployment sets through the `CRYPTO_KEY_FILE` environment variable.
- A running server encrypts its local secrets, such as its device key, its sync password and its copy of the [settings PSK](../administration/settings/secret-encryption.md), with that key and no other.
- A development environment is one whose `NODE_ENV` names it as development, test or end-to-end testing. Any other server, including one with no `NODE_ENV` set, is treated as a deployment.
- The default key path sits beside the server's own configuration, so every command run against that configuration reads the same key, whichever directory it is run from.
- In a development environment, a server whose configuration names the default key path and finds no file there generates a key at that path, so each development checkout has a key of its own.
- A deployment never generates its key. When the key file is missing, the server does not start.
- An upgrade stops when a configuration file holds an encrypted value the configured key does not decrypt, and names each such value so it can be re-encrypted with that key, noting when any are under the [published development key](#the-published-development-key).
- An encrypted configuration value that the server no longer reads, because the local secret store or a secret setting now holds what it held, does not stop an upgrade. The upgrade names it as unused so it can be removed.

> [!NOTE]
> A shell opened on a deployment usually carries no `NODE_ENV`, so a command run from one is held to the deployment's rules rather than generating a key that the next release would not have.

## The published development key

- The published development key is a development key in the repository's history. A deployment refuses it as its key wherever it is mounted, and does not start.
- An upgrade finds the local secrets that only the published development key decrypts, deleted ones included, and re-encrypts them under the configured key, in one transaction.
- When the configured key file is missing and the stored secrets are under the published development key, the upgrade stops and says how to provide a key for the server.

> [!NOTE]
> Re-encrypting during the upgrade lets a server that ran on the development key move to a key of its own by mounting one, without giving up the device key and sync credentials it already holds.
