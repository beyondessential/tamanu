# Production Seedling definitions

## Tamanu changes beside the definitions

- **Primary timezone check (SYNC, FSETUP):** a facility server compares its `TZ` with the `primaryTimeZone` central already returns from `/login` (`packages/central-server/app/auth/login.js`), at sync login in `CentralServerConnection` and in the setup wizard before minting sync credentials, and stops on a mismatch. This is what lets both definitions keep the timezone as an ordinary parameter defaulting to UTC.

## Dependencies

- **Supervisor specs (L13):** the Seedling definitions specs assume the supervisor specs return to `main` before this card merges, carrying the upgrading response in `specs/platform/supervisor/overview.md#upgrades`. Whether the platform's "upgrade finished" signal stays is filed on L13.
- **seedling/H6:** a definition update that moves the version parameter's default runs no change handler, so re-fetching a newer definition with the version at its default would start the new release on an unmigrated database. The upgrades spec's "changing the version upgrades the server" relies on H6 for that path.
- **seedling/J6:** a failed operation returns the app to its current generation's graph. The upgrades spec's "parts stay stopped" after a failed migration, and "a failed pull leaves the server untouched", both rely on J6.
