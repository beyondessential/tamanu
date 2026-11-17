# Server key test cases

## Reading the key

- [x] Outside production, a missing key file at the default path is generated on first read and reused after (verifies spec: SKEY)
- [x] Concurrent first reads at the default path agree on one generated key (verifies spec: SKEY)
- [x] No key is generated at a configured path other than the default, or in production (verifies spec: SKEY)
- [x] In production, the published development key is refused wherever it is mounted, and any other key is read (verifies spec: SKEY)

## Upgrade

- [x] Local secrets under the published development key are re-encrypted under the configured key in one transaction (verifies spec: SKEY)
- [x] In production, an upgrade with the published development key configured stops before rewriting anything (verifies spec: SKEY)
- [x] With no key file and secrets under the published development key, the upgrade says how to provide a key (verifies spec: SKEY)
- [x] A config value only the published development key decrypts is named, without its value (verifies spec: SKEY)
- [ ] A production-mode central server that ran on the published development key upgrades once a new key is mounted, and still syncs with its facilities afterwards (verifies spec: SKEY)
- [ ] A development database whose secrets are under the published development key upgrades on a fresh checkout, with the generated key (verifies spec: SKEY)
