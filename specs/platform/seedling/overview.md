---
id: SDEF
---

# Seedling definitions

Applies to the Seedling definitions that run a Tamanu central server and a Tamanu facility server on a Seedling host: what they run, the parameters they take, and how a server is brought up under them.

## Definitions

- Tamanu has two Seedling definitions, one for a central server and one for a facility server, each its own definition bundle.
- Both definitions live in the Tamanu repository, in the folders `seedling/central` and `seedling/facility`, and change in the same commit as the Tamanu code they describe.
- Each release [publishes its definitions](publishing.md) alongside its server images, and [changing a definition's version upgrades the server](upgrades.md).
- The definitions run on Seedling's Linux platform.

## What a definition runs

- A definition runs the server's parts from the release's images, with Tamanu's [supervisor](../supervisor/overview.md) in front of them as the server's front door.
- The definition configures the supervisor with no actuator, so the server never sleeps and the supervisor only routes.
- Seedling's ingress carries the server's traffic to the supervisor, and the definition sets the supervisor's trusted proxies to Seedling's.
- The definition sets every environment variable that is a property of how it runs the server, so the operator never sets them: ports, the disk-space path, the trusted-proxy list, and migrations at startup, which is off.

## Database

- A definition connects to a PostgreSQL database the operator provides, named by a database URL parameter.
- A definition runs no database of its own and depends on no other Seedling app.
- The database URL carries the role's password, so the database can authenticate that role by password.

## Parameters

- Both definitions take the database URL, the server's crypto key and its authentication secrets as secret parameters, set by the operator.
- Both definitions take the server's canonical URL, which is required, and the server's primary timezone, which defaults to UTC.
- Central also takes an optional patient portal URL. Setting it runs the patient portal, served at that URL.

## Ingress

- A definition declares an ingress for its canonical URL, and on central for its patient portal URL when set.
- An `https` URL gets an ingress that terminates TLS for its hostname. An `http` URL gets a plain ingress, with no TLS.
- The patient portal's ingress carries its API requests to the server as well as the portal itself.

## Configuration

- A server under a Seedling definition takes its configuration from settings and environment variables only, as [configuration sources](../../administration/settings/overview.md#configuration-sources) describe, and runs without a configuration file.

## Readiness check

- Installing a server checks, before anything is started, that the database URL connects and that the crypto key decrypts any secrets the database already holds.
- A failed check fails the install, naming which check failed, and leaves nothing running.

## First run

- Installing a server migrates its database to the definition's version and starts the server.
- A central definition offers a **Provision** action, which provisions a newly installed central server from a provisioning file the operator supplies.
- A newly installed facility server is connected to its central server through its [setup wizard](../facility-setup.md#setup-wizard), which also sets the facilities it serves.
