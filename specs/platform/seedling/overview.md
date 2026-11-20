---
id: SDDEF
---

# Seedling definitions

Applies to the Seedling definitions that run a Tamanu central server and a Tamanu facility server on a Seedling host: what they run, the parameters they take, and how a server is brought up under them.

## Borrowed terms

- [Definition bundle](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/overview.md#definition-bundle): the set of files that defines a Seedling app, and that Seedling installs and runs.
- [Parameter](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/language/parameter.md): a named value an operator sets on an installed app, which its definition reads.
- [Action](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/overview.md#action): a named operation a definition offers, which an operator invokes.
- [Gate](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/language/gate.md): a named step a definition declares, which Seedling runs whenever the value it is keyed on changes, retries until it succeeds, and holds back the parts ordered after it until then.
- [Ingress](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/language/ingress.md): the entry point by which Seedling carries traffic for a hostname to an app, terminating TLS where it is declared to.
- [Site volume](https://github.com/beyondessential/seedling/blob/main/.workhorse/specs/overview.md#site-volume): storage on the Seedling host that an operator manages and names to an app.

## Definitions

- Tamanu has two Seedling definitions, one for a central server and one for a facility server, each its own definition bundle.
- Both definitions live in the Tamanu repository, in the folders `seedling/central` and `seedling/facility`, and change in the same commit as the Tamanu code they describe.
- Each release [publishes its definitions](publishing.md) alongside its server images, and [changing a definition's version upgrades the server](upgrades.md).
- The definitions run on Seedling's Linux platform.

## What a definition runs

- A central definition runs the API, the background tasks, the FHIR workers and the web app, and the patient portal when its URL is set.
- A facility definition runs the API, sync, the background tasks, the FHIR worker and the web app.
- Each part runs from the image of the version the definition is set to, with Tamanu's [supervisor](../supervisor/overview.md) in front of them as the server's front door.
- The definition configures the supervisor with no actuator, so the server never sleeps and the supervisor only routes.
- The definition gives the supervisor durable storage for its state.
- Seedling's ingress carries the server's traffic to the supervisor. The definition sets the supervisor's trusted proxies to Seedling's, and the parts' trusted proxies to the supervisor.
- The definition sets every environment variable that is a property of how it runs the server, so the operator never sets them: ports, the disk-space path, the trusted-proxy lists, console logging, which is on, and migrations at startup, which are off.

## Database

- A definition connects to a PostgreSQL database the operator provides, named by a database URL parameter.
- The database is the only thing outside the definition that the server depends on.
- The database authenticates the server's role by the password the database URL carries.

## Parameters

- Both definitions take the database URL, the server's crypto key and its authentication secrets as secret parameters.
- An operator installing a new server can generate the crypto key and authentication secrets, or enter an existing deployment's.
- Both definitions take the server's canonical URL, which is required, and the server's primary timezone, which defaults to UTC.
- The definition sets the server's canonical host name from its canonical URL.
- Central also takes an optional patient portal URL. Setting it runs the patient portal, served at that URL.

### Canonical URLs

- The canonical URL and the patient portal URL each name an origin: an `http` or `https` scheme, a hostname, and optionally a port.
- A URL with any other scheme, or with a path, query or fragment, is refused, naming what it carries.

### Changing a parameter

- Changing the database URL, crypto key, authentication secrets, canonical URL or primary timezone of an installed server restarts the parts that use it, with the new value.
- Setting the patient portal URL on an installed central server starts the patient portal and its ingress. Unsetting it stops them.
- Changing the primary timezone leaves the datetimes already stored as they are, read in the new timezone.
- A facility server's primary timezone matches its central server's.

## Ingress

- A definition declares an ingress for its canonical URL, and on central for its patient portal URL when set.
- An ingress listens on the port its URL names, or on the scheme's default port when it names none.
- An `https` URL gets an ingress that terminates TLS for its hostname, and plain HTTP to that hostname on port 80 is redirected to it.
- An `http` URL gets a plain ingress, with no TLS.
- The patient portal's ingress carries its API requests to the server as well as the portal itself.

## Configuration

- A server under a Seedling definition takes its configuration from settings and environment variables only, as [configuration sources](../../administration/settings/overview.md#configuration-sources) describe, and runs without a configuration file.

## Readiness check

- A definition's **readiness** [gate](#borrowed-terms) checks that the database URL connects and that the crypto key decrypts any secrets the database already holds.
- No part of the server, the supervisor included, starts until the readiness check passes.
- A failed check leaves the server with a fault naming which check failed, and is retried until it passes.
- Changing the database URL or crypto key runs the readiness check again. The parts go on running with the previous value until it passes, then restart with the new one.

## First run

- Installing a server runs its readiness check, migrates its database to the definition's version, and starts the server.
- A central definition offers a **Provision** action, which provisions a newly installed central server from a provisioning file, and the files it refers to, on a site volume the operator names.
- Provision refuses a server that already holds the provisioning file's administrator users, and leaves it unchanged.
- A newly installed facility server is connected to its central server through its [setup wizard](../facility-setup.md#setup-wizard), which also sets the facilities it serves.
- The setup wizard is reachable only from the private networks it allows, because the trusted proxies pass the client's own address through to the server.
