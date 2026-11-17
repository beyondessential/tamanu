# Production Seedling definitions

## Dependencies

- **Supervisor specs (L13):** the Seedling definitions specs assume the supervisor specs return to `main` before this card merges, carrying the upgrading response in `specs/platform/supervisor/overview.md#upgrades`. Whether the platform's "upgrade finished" signal stays is filed on L13.
- **seedling/H6:** a definition update that moves the version parameter's default runs no change handler, so re-fetching a newer definition with the version at its default would start the new release on an unmigrated database. The upgrades spec's "changing the version upgrades the server" relies on H6 for that path.
- **seedling/J6:** a failed operation returns the app to its current generation's graph. The upgrades spec's "parts stay stopped" after a failed migration, and "a failed pull leaves the server untouched", both rely on J6.
